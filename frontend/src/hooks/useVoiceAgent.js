import { useState, useEffect, useRef, useCallback } from 'react';
import { createSession, addConversation, endSession } from '../utils/api';

export function useVoiceAgent(config) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [interviewStats, setInterviewStats] = useState({
    isActive: false,
    questionsCount: 0,
    duration: '00:00',
    status: 'Ready'
  });

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const interviewStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const timeCheckIntervalRef = useRef(null);
  const silentFrameIntervalRef = useRef(null);
  const userSpeakingStartTimeRef = useRef(null);
  const lastTimeCheckMinuteRef = useRef(0);
  const scheduledSourcesRef = useRef([]);
  const startTimeRef = useRef(0);
  const gainNodeRef = useRef(null);
  const gainConnectedRef = useRef(false);
  const sessionIdRef = useRef(null); // Use ref to avoid stale closure issues

  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  // Update status
  const updateStatus = useCallback((type, text) => {
    setStatus(text);
  }, []);

  // Add message to conversation (both local state and backend)
  const addMessage = useCallback((role, content, metadata = {}) => {
    const message = {
      role,
      content,
      timestamp: new Date().toLocaleTimeString(),
      ...metadata
    };

    setMessages(prev => [...prev, message]);

    if (role === 'interviewer') {
      setInterviewStats(prev => ({
        ...prev,
        questionsCount: prev.questionsCount + 1
      }));
    }

    // Save to backend if session exists (fire and forget)
    // Use ref to get latest sessionId value (avoids stale closure)
    const currentSessionId = sessionIdRef.current || sessionId;
    if (currentSessionId) {
      const backendRole = role === 'interviewer' ? 'assistant' : 'user';
      console.log(`💾 Attempting to save conversation: ${role} (sessionId: ${currentSessionId})`);
      addConversation(currentSessionId, backendRole, content, {
        ...metadata,
        isQuestion: role === 'interviewer' && metadata.isQuestion !== false
      }).then(() => {
        console.log(`✅ Conversation saved successfully: ${role} - ${content.substring(0, 50)}...`);
      }).catch(error => {
        console.error('❌ Error saving conversation to backend:', error);
        // Don't throw - just log, continue with local state
      });
    } else {
      console.warn('⚠️ Cannot save conversation - sessionId is null (state:', sessionId, ', ref:', sessionIdRef.current, ')');
    }
  }, [sessionId]);

  // Convert Float32 PCM to Int16 PCM
  const convertFloatToPcm = (floatData) => {
    const pcmData = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      const s = Math.max(-1, Math.min(1, floatData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcmData;
  };

  // Play audio (raw PCM 16-bit mono, 24 kHz output)
  const playAudio = useCallback(async (arrayBuffer) => {
    if (!audioContextRef.current) {
      console.error('No audio context available for playback');
      return;
    }

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (gainNodeRef.current && !gainConnectedRef.current) {
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainConnectedRef.current = true;
      }

      const audioDataView = new Int16Array(arrayBuffer);
      if (audioDataView.length === 0) {
        console.error('Received audio data is empty.');
        return;
      }

      const float32 = new Float32Array(audioDataView.length);
      for (let i = 0; i < audioDataView.length; i++) {
        float32[i] = audioDataView[i] / 32768;
      }

      const channels = 1;
      const sampleRate = 24000;
      const manualBuf = audioContextRef.current.createBuffer(channels, float32.length, sampleRate);
      manualBuf.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = manualBuf;
      if (gainNodeRef.current) {
        source.connect(gainNodeRef.current);
      } else {
        source.connect(audioContextRef.current.destination);
      }

      const now = audioContextRef.current.currentTime;
      if (!startTimeRef.current || startTimeRef.current < now) startTimeRef.current = now;

      source.start(startTimeRef.current);
      startTimeRef.current += manualBuf.duration;
      scheduledSourcesRef.current.push(source);

      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
        console.log('Audio playback finished');
      };

      console.log('Scheduled raw PCM audio at', startTimeRef.current - manualBuf.duration, 'duration', manualBuf.duration);
    } catch (error) {
      console.error('Error in playAudio:', error);
    }
  }, []);

  // Start interview timer
  const startInterviewTimer = useCallback(() => {
    interviewStartTimeRef.current = Date.now();
    lastTimeCheckMinuteRef.current = 0;

    setInterviewStats(prev => ({
      ...prev,
      isActive: true,
      status: 'In Progress'
    }));

    durationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - interviewStartTimeRef.current;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setInterviewStats(prev => ({
        ...prev,
        duration: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }));
    }, 1000);

    timeCheckIntervalRef.current = setInterval(() => {
      checkInterviewTime();
    }, 60000);
  }, []);

  // Check interview time
  const checkInterviewTime = () => {
    if (!interviewStartTimeRef.current || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const elapsed = Date.now() - interviewStartTimeRef.current;
    const currentMinute = Math.floor(elapsed / 60000);

    if (currentMinute !== lastTimeCheckMinuteRef.current && [5, 10, 15].includes(currentMinute)) {
      const timeRemaining = 20 - currentMinute;
      const contextMessage = {
        type: 'InjectAgentContext',
        content: `[SYSTEM: ${currentMinute} minutes have passed. About ${timeRemaining} minutes remaining. ${currentMinute >= 15 ? 'Begin wrapping up - mention time naturally like "We have about 5 minutes left, so let me ask one more question..."' : currentMinute === 10 ? 'Mention time casually: "We\'re about halfway through..."' : ''}]`
      };
      socketRef.current.send(JSON.stringify(contextMessage));
      lastTimeCheckMinuteRef.current = currentMinute;
    }
  };

  // Stop interview timer
  const stopInterviewTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (timeCheckIntervalRef.current) {
      clearInterval(timeCheckIntervalRef.current);
      timeCheckIntervalRef.current = null;
    }
    setInterviewStats(prev => ({
      ...prev,
      status: 'Completed'
    }));
  }, []);

  // Start audio streaming
  const startStreaming = useCallback(async () => {
    // In text mode, send silent audio frames
    if (config.interactionMode === 'text') {
      silentFrameIntervalRef.current = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const silentPcm = new Int16Array(2048);
          socketRef.current.send(silentPcm.buffer);
        }
      }, 100);
      return;
    }

    if (!mediaStreamRef.current || !socketRef.current) return;

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        if (isFirefox) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      const bufferSize = 2048;
      processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      let lastSendTime = 0;
      const sendInterval = 100;

      processorRef.current.onaudioprocess = (e) => {
        const now = Date.now();
        if (socketRef.current?.readyState === WebSocket.OPEN && now - lastSendTime >= sendInterval) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = convertFloatToPcm(inputData);
          socketRef.current.send(pcmData.buffer);
          lastSendTime = now;
        }
      };
    } catch (error) {
      console.error('Error starting audio stream:', error);
      updateStatus('error', 'ERROR: ' + error.message);
    }
  }, [config.interactionMode, updateStatus]);

  // Stop audio streaming
  const stopStreaming = useCallback(() => {
    if (silentFrameIntervalRef.current) {
      clearInterval(silentFrameIntervalRef.current);
      silentFrameIntervalRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Generate interview prompt
  const generateInterviewPrompt = (cfg) => {
    const roleNames = {
      software_engineer: 'Software Engineer',
      frontend_developer: 'Frontend Developer',
      backend_developer: 'Backend Developer',
      data_scientist: 'Data Scientist',
      product_manager: 'Product Manager',
      devops_engineer: 'DevOps Engineer',
      full_stack_developer: 'Full Stack Developer',
      ml_engineer: 'Machine Learning Engineer',
      custom: cfg.customRole || 'Software Engineer'
    };

    const roleName = roleNames[cfg.role] || 'Software Engineer';
    const companyName = cfg.companyName || 'a growing tech company';

    const resumeContext = cfg.resumeContent ? `\n\nCANDIDATE'S RESUME/BACKGROUND:\n${cfg.resumeContent.substring(0, 3000)}\n\nUse the above resume to:\n- Ask specific questions about their listed experiences and projects\n- Probe deeper into technologies and skills they mention\n- Reference their past roles and accomplishments naturally\n- Tailor questions to match their background and expertise level\n- Connect their experience to the role they're interviewing for\n` : '';

    const experienceLevel = {
      entry: 'entry-level position (0-2 years)',
      mid: 'mid-level position (3-5 years)',
      senior: 'senior position (6-10 years)',
      lead: 'lead/principal position (10+ years)'
    }[cfg.difficulty] || 'mid-level position';

    const isTechnicalInterview = cfg.interviewType === 'technical' || cfg.interviewType === 'mixed';

    const codingProblemContext = isTechnicalInterview ? `


╔════════════════════════════════════════════════════════════════╗
║              CODING PROBLEM FOR THIS INTERVIEW                 ║
╚════════════════════════════════════════════════════════════════╝

Problem: Two Sum

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROBLEM STATEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Given an array of integers nums and an integer target, return indices of 
the two numbers such that they add up to target.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• You may assume that each input would have exactly one solution
• You may not use the same element twice
• You can return the answer in any order

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 1:
  Input:  nums = [2, 7, 11, 15], target = 9
  Output: [0, 1]
  Explanation: nums[0] + nums[1] = 2 + 7 = 9

Example 2:
  Input:  nums = [3, 2, 4], target = 6
  Output: [1, 2]
  Explanation: nums[1] + nums[2] = 2 + 4 = 6

Example 3:
  Input:  nums = [3, 3], target = 6
  Output: [0, 1]
  Explanation: nums[0] + nums[1] = 3 + 3 = 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT - CODING PROBLEM INTERVIEW BEHAVIOR:
- After asking background questions, introduce the coding problem
- IMPORTANT: When you first introduce the coding problem, you MUST include the exact phrase "[SHOW_PROBLEM]" at the start of your message (the candidate won't see this marker, it's just a signal)
- Example: "[SHOW_PROBLEM] Now I'd like you to solve a coding problem. I'll present it to you, and you'll code your solution in the editor. Take your time to think it through."
- Then present the problem clearly: "Here's the problem: Given an array of integers and a target sum, find the indices of two numbers that add up to the target."
- Give them space to think and code - don't rush them
- If they seem stuck, provide gentle hints but don't give away the solution
- When they submit their code, you'll receive feedback about their solution via system messages
- Use that feedback to provide hints and guidance conversationally
- Be encouraging but challenging - help them think through edge cases
- If their solution is incorrect, give hints to guide them toward the correct approach (e.g., "Think about data structures that could help you look up values quickly", "Consider the time complexity - can you do better than O(n²)?")
- If correct, ask them to explain their approach and discuss time/space complexity
- Keep the conversation natural - integrate hints into the conversation flow
- Don't just read the feedback verbatim - rephrase it conversationally
` : '';

    return `You are Jordan Lee, a demanding Senior Engineering Director at a top-tier tech company, conducting a rigorous interview for a ${roleName} ${experienceLevel} at ${companyName}. You have exceptionally high standards and limited patience for vague answers.
${resumeContext}${codingProblemContext}

Your interviewing style:
- Direct and professional - no unnecessary small talk
- Challenge every answer with follow-up questions
- Demand specifics - push back on vague or surface-level responses
- Cut through buzzwords and ask what they actually did
- Interrupt if they're wasting time with irrelevant details
- Show skepticism when answers seem rehearsed or generic
- Point out inconsistencies or gaps in their reasoning
- Ask "why" and "how" relentlessly - make them prove their claims
- Don't praise easily - acknowledge competent answers but keep pressure on
- If they can't answer, move on quickly without sugar-coating it
- Test their technical depth aggressively
- Challenge their design decisions and trade-offs
- Make them defend their choices under scrutiny

Interview structure:
1. Brief introduction - get straight to business
2. "Walk me through your background - focus on what's relevant"
3. ${isTechnicalInterview ? 'Introduce the coding problem and let them work on it. Provide hints when they submit code.' : 'Ask 5-7 increasingly difficult questions based on interview type'}
4. Drill into weak areas without mercy
5. Push them on technical details they claim to know
6. Challenge assumptions in their answers
7. Test problem-solving under pressure
8. After 15 minutes, cut to final question
9. End professionally but don't over-praise

Critical behaviors:
- No hand-holding - if they struggle, that's valuable signal
- Push for concrete examples, not theoretical knowledge
- Call out hand-wavy answers directly
- Ask follow-ups that expose gaps in understanding
- Escalate question difficulty based on their claimed expertise
- Don't accept "I think" - demand "I know" or "I don't know"
- Test if they actually understand the technologies they list
- Challenge them to explain complex concepts simply
- React with skepticism to overconfident claims
- Don't let them dodge technical questions with soft skills talk

FORMATTING INSTRUCTIONS:
- Do NOT use markdown formatting in your responses (no **bold**, no *italic*, no code blocks, etc.)
- Write in plain text only - avoid any markdown syntax including asterisks for bold text
- Do not include ** or any markdown symbols in your responses${cfg.interactionMode === 'text' ? '\n\nNOTE: The candidate will be typing their responses, not speaking. Keep your questions clear and wait for their text input.' : ''}`;
  };

  // Start interview
  const startInterview = useCallback(async () => {
    try {
      updateStatus('connecting', 'CONNECTING');

      // Create session in backend
      try {
        const sessionResponse = await createSession(config, {
          fileName: '',
          content: config.resumeContent || ''
        });
        if (sessionResponse.success && sessionResponse.session) {
          const newSessionId = sessionResponse.session.sessionId;
          setSessionId(newSessionId);
          sessionIdRef.current = newSessionId; // Update ref as well
          console.log('✅ Session created successfully:', newSessionId);
        } else {
          console.error('❌ Session creation failed - no session returned');
        }
      } catch (error) {
        console.error('Error creating session:', error);
        // Continue with interview even if session creation fails
      }

      // Reset playback scheduling state to avoid stale start times between sessions
      startTimeRef.current = 0;
      scheduledSourcesRef.current = [];
      gainConnectedRef.current = false;

      // Create audio context
      if (isFirefox) {
        audioContextRef.current = new AudioContext();
      } else {
        // Mirror working repo: use 16000 for input capture; playback buffers declare 24000 explicitly
        audioContextRef.current = new AudioContext({
          sampleRate: 16000,
          latencyHint: 'interactive'
        });
      }

      // Boost playback volume slightly via gain node
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.6; // 1.0 = unity, >1.0 boosts loudness

      // Only request microphone if in speech mode
      if (config.interactionMode === 'speech') {
        let audioConstraints;
        if (isFirefox) {
          audioConstraints = {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: false,
          };
        } else {
          audioConstraints = {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          };
        }

        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints
        });
      }

      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/agent/converse`;
      socketRef.current = new WebSocket(wsUrl);
      socketRef.current.binaryType = 'arraybuffer';

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      socketRef.current.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          playAudio(arrayBuffer);
        } else if (event.data instanceof ArrayBuffer) {
          playAudio(event.data);
        } else {
          try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);

            if (message.type === 'Welcome') {
              updateStatus('connected', 'CONNECTED');

              const interviewPrompt = generateInterviewPrompt(config);

              const settings = {
                type: 'Settings',
                audio: {
                  input: {
                    encoding: 'linear16',
                    sample_rate: audioContextRef.current.sampleRate
                  },
                  output: {
                    encoding: 'linear16',
                    sample_rate: 24000,
                    container: 'none'
                  }
                },
                agent: {
                  listen: {
                    provider: {
                      type: 'deepgram',
                      model: 'nova-3'
                    }
                  },
                  think: {
                    provider: {
                      type: 'open_ai',
                      model: 'gpt-4o'
                    },
                    prompt: interviewPrompt + (config.interactionMode === 'text' ? '\n\nNOTE: The candidate will be typing their responses, not speaking. Keep your questions clear and wait for their text input.' : '')
                  },
                  speak: {
                    provider: {
                      type: 'deepgram',
                      model: 'aura-2-orpheus-en'
                    }
                  },
                  greeting: `Good morning. I'm Jordan Lee, Engineering Director at ${config.companyName || 'the company'}. I've got about 15 minutes for this ${config.role.replace(/_/g, ' ')} interview.${config.resumeContent ? " I've reviewed your resume." : ""} Let's get started - give me your background, focus on what's relevant to this role.`
                }
              };

              socketRef.current.send(JSON.stringify(settings));
            } else if (message.type === 'SettingsApplied') {
              updateStatus('connected', 'CONNECTED');
              startInterviewTimer();
              startStreaming();
            } else if (message.type === 'ConversationText') {
              const role = message.role === 'user' ? 'user' : 'interviewer';
              // Check for the [SHOW_PROBLEM] marker before stripping
              const hasShowProblemMarker = message.content.includes('[SHOW_PROBLEM]');
              // Remove the [SHOW_PROBLEM] marker from the content before displaying
              const content = message.content.replace(/\[SHOW_PROBLEM\]\s*/g, '');
              // Pass the marker info as metadata, and include isQuestion for interviewer messages
              const isQuestion = role === 'interviewer';
              const metadata = { isQuestion };
              if (hasShowProblemMarker) {
                metadata.showProblem = true;
              }
              addMessage(role, content, metadata);
            } else if (message.type === 'Error') {
              console.error('Agent error:', message);
              updateStatus('error', 'ERROR: ' + message.description);
            } else if (message.type === 'UserStartedSpeaking') {
              userSpeakingStartTimeRef.current = Date.now();
              setTimeout(() => {
                if (userSpeakingStartTimeRef.current && (Date.now() - userSpeakingStartTimeRef.current) >= 90000) {
                  sendInterruptionSignal();
                }
              }, 90000);
            } else if (message.type === 'UserStoppedSpeaking') {
              userSpeakingStartTimeRef.current = null;
            } else if (message.type === 'AgentThinking') {
              userSpeakingStartTimeRef.current = null;
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('error', 'ERROR: Connection error');
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        updateStatus('disconnected', 'DISCONNECTED');
      };

    } catch (error) {
      console.error('Error starting interview:', error);
      updateStatus('error', 'ERROR: ' + error.message);
    }
  }, [config, updateStatus, addMessage, startInterviewTimer, startStreaming, playAudio]);

  // Send interruption signal
  const sendInterruptionSignal = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !userSpeakingStartTimeRef.current) {
      return;
    }

    const contextMessage = {
      type: 'InjectAgentContext',
      content: '[SYSTEM: User has been speaking for over 90 seconds. Politely interrupt NOW with phrases like "That\'s great context, let me stop you there for a moment..." or "I appreciate all that detail - can I ask you specifically about..."]'
    };

    socketRef.current.send(JSON.stringify(contextMessage));
    userSpeakingStartTimeRef.current = null;
  };

  // Clear scheduled audio sources
  const clearScheduledAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) return;
      scheduledSourcesRef.current.forEach((src) => {
        try {
          src.onended = null;
          src.stop();
        } catch (e) {
          // ignore
        }
      });
      scheduledSourcesRef.current = [];
      startTimeRef.current = 0;
    } catch (err) {
      console.warn('Failed to clear scheduled audio:', err);
    }
  }, []);

  // End interview
  const endInterview = useCallback(async () => {
    stopStreaming();
    clearScheduledAudio();
    stopInterviewTimer();

    // End session in backend
    if (sessionId) {
      try {
        await endSession(sessionId, {
          questionCount: interviewStats.questionsCount,
          totalMessages: messages.length,
          userMessages: messages.filter(m => m.role === 'user').length,
          agentMessages: messages.filter(m => m.role === 'interviewer').length
        });
        console.log('Session ended:', sessionId);
      } catch (error) {
        console.error('Error ending session:', error);
        // Continue even if session end fails
      }
    }

    gainConnectedRef.current = false;
    gainNodeRef.current = null;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    updateStatus('disconnected', 'DISCONNECTED');
  }, [stopStreaming, stopInterviewTimer, updateStatus, sessionId, interviewStats, messages]);

  // Reset interview
  const resetInterview = useCallback(() => {
    endInterview();
    setMessages([]);
    setSessionId(null);
    sessionIdRef.current = null; // Clear ref as well
    setInterviewStats({
      isActive: false,
      questionsCount: 0,
      duration: '00:00',
      status: 'Ready'
    });
  }, [endInterview]);

  // Send text response (for text mode)
  const sendTextResponse = useCallback((message) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const injectMessage = {
      type: 'InjectUserMessage',
      content: message
    };

    socketRef.current.send(JSON.stringify(injectMessage));
  }, []);

  // Inject hint/context into the conversation (for code feedback)
  const injectHint = useCallback((hint) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const contextMessage = {
      type: 'InjectAgentContext',
      content: `[SYSTEM: Provide this feedback to the candidate as part of our conversation: ${hint}]`
    };

    socketRef.current.send(JSON.stringify(contextMessage));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount - use refs to avoid dependency issues
      if (silentFrameIntervalRef.current) {
        clearInterval(silentFrameIntervalRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (timeCheckIntervalRef.current) {
        clearInterval(timeCheckIntervalRef.current);
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    isConnected,
    status,
    messages,
    interviewStats,
    sessionId,
    startInterview,
    endInterview,
    resetInterview,
    sendTextResponse,
    injectHint
  };
}
