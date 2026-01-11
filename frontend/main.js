// DOM Elements
const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const cancelButton = document.getElementById('cancelButton');
const sendButton = document.getElementById('sendButton');
const injectUserMessageInput = document.getElementById('injectUserMessageInput');
const statusBanner = document.getElementById('statusBanner');
const statusText = document.getElementById('statusText');
const conversationHistory = document.getElementById('conversationHistory');

// Interview configuration elements
const roleSelect = document.getElementById('roleSelect');
const customRoleInput = document.getElementById('customRoleInput');
const companyNameInput = document.getElementById('companyNameInput');
const resumeUpload = document.getElementById('resumeUpload');
const resumeFileName = document.getElementById('resumeFileName');
const interviewTypeSelect = document.getElementById('interviewTypeSelect');
const difficultySelect = document.getElementById('difficultySelect');
const interactionModeSelect = document.getElementById('interactionModeSelect');
const textResponseContainer = document.getElementById('textResponseContainer');
const textResponseInput = document.getElementById('textResponseInput');
const sendResponseButton = document.getElementById('sendResponseButton');
const interviewStats = document.getElementById('interviewStats');
const questionsCount = document.getElementById('questionsCount');
const interviewDuration = document.getElementById('interviewDuration');
const interviewStatus = document.getElementById('interviewStatus');

// Browser detection
const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

// State
let socket = null;
let mediaStream = null;
let audioContext = null;
let processor = null;
let isConnected = false;
let isRecording = false;
let startTime = 0;
let scheduledAudioSources = [];
let connectionTimeout = null;

// Interview state
let interviewStartTime = null;
let durationInterval = null;
let questionCounter = 0;
let userSpeakingStartTime = null;
let timeCheckInterval = null;
let lastTimeCheckMinute = 0;
let resumeContent = '';
let interviewMode = 'speech'; // 'speech' or 'text'
let interviewConfig = {
  role: 'software_engineer',
  customRole: '',
  companyName: '',
  interviewType: 'behavioral',
  difficulty: 'mid'
};

// Update status display
function updateStatus(status, message) {
  // Update status banner
  statusBanner.className = 'dg-status';

  if (status === 'connected') {
    statusBanner.classList.add('dg-status--success');
    startButton.disabled = true;
    endButton.disabled = false;
    sendButton.disabled = false;
    injectUserMessageInput.disabled = false;
  } else if (status === 'disconnected') {
    statusBanner.classList.add('dg-status--error');
    startButton.disabled = false;
    endButton.disabled = true;
    sendButton.disabled = true;
    injectUserMessageInput.disabled = true;
  } else if (status === 'connecting') {
    statusBanner.classList.add('dg-status--info');
    startButton.disabled = true;
    endButton.disabled = true;
    sendButton.disabled = true;
    injectUserMessageInput.disabled = true;
  } else if (status === 'error') {
    statusBanner.classList.add('dg-status--error');
    startButton.disabled = false;
    endButton.disabled = true;
    sendButton.disabled = true;
    injectUserMessageInput.disabled = true;
  }

  // Ensure statusText element exists and update message
  // Always re-query to avoid stale reference after innerHTML changes
  const currentStatusText = document.getElementById('statusText');
  if (!currentStatusText) {
    statusBanner.innerHTML = '<span id="statusText">' + message + '</span>';
  } else {
    currentStatusText.textContent = message;
  }
}

// Add message to conversation history
function addMessage(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const roleDiv = document.createElement('div');
  roleDiv.className = 'role';
  
  // Map assistant to interviewer
  const displayRole = role === 'assistant' ? 'Interviewer' : 'You';
  roleDiv.textContent = displayRole + ':';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'content';
  contentDiv.textContent = content;

  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'timestamp';
  timestampDiv.textContent = new Date().toLocaleTimeString();

  messageDiv.appendChild(roleDiv);
  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timestampDiv);

  conversationHistory.appendChild(messageDiv);
  conversationHistory.scrollTop = conversationHistory.scrollHeight;
  
  // Track questions from interviewer
  if (role === 'assistant' && content.includes('?')) {
    questionCounter++;
    updateInterviewStats();
  }
  
  // Track questions from interviewer
  if (role === 'assistant' && content.includes('?')) {
    questionCounter++;
    updateInterviewStats();
  }
}

// Update interview statistics display
function updateInterviewStats() {
  if (questionsCount) {
    questionsCount.textContent = questionCounter;
  }
}

// Start interview timer
function startInterviewTimer() {
  interviewStartTime = Date.now();
  interviewStats.style.display = 'block';
  interviewStatus.textContent = 'In Progress';
  interviewStatus.style.color = '#13ef95';
  lastTimeCheckMinute = 0;
  
  durationInterval = setInterval(() => {
    const elapsed = Date.now() - interviewStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    interviewDuration.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
  
  // Check for time updates to send to interviewer
  timeCheckInterval = setInterval(() => {
    checkInterviewTime();
  }, 60000); // Check every minute
}

// Stop interview timer
function stopInterviewTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
    timeCheckInterval = null;
  }
  interviewStatus.textContent = 'Completed';
  interviewStatus.style.color = '#00d4ff';
}

// Reset interview stats
function resetInterviewStats() {
  questionCounter = 0;
  interviewStartTime = null;
  userSpeakingStartTime = null;
  lastTimeCheckMinute = 0;
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
    timeCheckInterval = null;
  }
  interviewStats.style.display = 'none';
  questionsCount.textContent = '0';
  interviewDuration.textContent = '00:00';
  interviewStatus.textContent = 'Ready';
  interviewStatus.style.color = '#ffa500';
}

// Check interview time and notify agent
function checkInterviewTime() {
  if (!interviewStartTime || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  
  const elapsed = Date.now() - interviewStartTime;
  const currentMinute = Math.floor(elapsed / 60000);
  
  // Send time updates at 5, 10, and 15 minutes
  if (currentMinute !== lastTimeCheckMinute && [5, 10, 15].includes(currentMinute)) {
    const timeRemaining = 20 - currentMinute; // Assuming 20 min interview
    const contextMessage = {
      type: 'InjectAgentContext',
      content: `[SYSTEM: ${currentMinute} minutes have passed. About ${timeRemaining} minutes remaining. ${currentMinute >= 15 ? 'Begin wrapping up - mention time naturally like "We have about 5 minutes left, so let me ask one more question..."' : currentMinute === 10 ? 'Mention time casually: "We\'re about halfway through..."' : ''}]`
    };
    socket.send(JSON.stringify(contextMessage));
    lastTimeCheckMinute = currentMinute;
  }
}

// Send interruption signal to agent
function sendInterruptionSignal() {
  if (!socket || socket.readyState !== WebSocket.OPEN || !userSpeakingStartTime) {
    return;
  }
  
  const contextMessage = {
    type: 'InjectAgentContext',
    content: '[SYSTEM: User has been speaking for over 90 seconds. Politely interrupt NOW with phrases like "That\'s great context, let me stop you there for a moment..." or "I appreciate all that detail - can I ask you specifically about..." or "That\'s really interesting - let me redirect for just a second..."]'
  };
  
  socket.send(JSON.stringify(contextMessage));
  userSpeakingStartTime = null; // Prevent multiple interruptions
}

// Convert Float32 PCM to Int16 PCM
function convertFloatToPcm(floatData) {
  const pcmData = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    const s = Math.max(-1, Math.min(1, floatData[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcmData;
}


// Play audio with scheduled timing (eliminates gaps between packets)
async function playAudio(audioData) {
  if (!audioContext) return;

  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const audioDataView = new Int16Array(audioData);

    if (audioDataView.length === 0) {
      console.error('Received audio data is empty.');
      return;
    }

    // Create buffer with correct sample rate for agent's audio (24000Hz)
    const audioBuffer = audioContext.createBuffer(1, audioDataView.length, 24000);
    const audioBufferChannel = audioBuffer.getChannelData(0);

    // Convert Int16 to Float32
    for (let i = 0; i < audioDataView.length; i++) {
      audioBufferChannel[i] = audioDataView[i] / 32768;
    }

    // Create and configure source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    // Schedule audio at precise time to eliminate gaps
    const currentTime = audioContext.currentTime;
    if (startTime < currentTime) {
      startTime = currentTime;
    }

    source.start(startTime);

    // Update start time for next audio packet (seamless queueing)
    startTime = startTime + audioBuffer.duration;
    scheduledAudioSources.push(source);
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}

// Clear all scheduled audio (called when user interrupts)
function clearScheduledAudio() {
  if (!audioContext) return;

  scheduledAudioSources.forEach((source) => {
    try {
      source.stop();
      source.onended = null;
    } catch (e) {
      // Source may have already ended or not started yet
    }
  });
  scheduledAudioSources = [];

  const scheduledAudioMs = Math.round(
    1000 * (startTime - audioContext.currentTime)
  );
  if (scheduledAudioMs > 0) {
    console.log(`Cleared ${scheduledAudioMs}ms of scheduled audio`);
  }

  startTime = 0;
}

// Start audio streaming to server
async function startStreaming() {
  // In text mode, send silent audio frames to keep connection alive
  if (interviewMode === 'text') {
    isRecording = false;
    if (textResponseContainer) {
      textResponseContainer.style.display = 'block';
    }
    
    // Send silent audio frames periodically to prevent disconnection
    const silentFrameInterval = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        // Create silent PCM data (2048 samples of zeros)
        const silentPcm = new Int16Array(2048);
        socket.send(silentPcm.buffer);
      } else {
        clearInterval(silentFrameInterval);
      }
    }, 100); // Send every 100ms
    
    // Store interval ID for cleanup
    if (!window.textModeIntervals) window.textModeIntervals = [];
    window.textModeIntervals.push(silentFrameInterval);
    
    return;
  }
  
  if (!mediaStream || !isConnected) return;

  try {
    // Resume AudioContext if suspended (especially important for Firefox)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      if (isFirefox) {
        // Give Firefox a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const source = audioContext.createMediaStreamSource(mediaStream);

    // Create audio processor
    const bufferSize = 2048;
    processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    let lastSendTime = 0;
    const sendInterval = 100; // Send every 100ms

    processor.onaudioprocess = (e) => {
      const now = Date.now();
      if (socket?.readyState === WebSocket.OPEN && now - lastSendTime >= sendInterval) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = convertFloatToPcm(inputData);
        socket.send(pcmData.buffer);
        lastSendTime = now;
      }
    };

    isRecording = true;
  } catch (error) {
    console.error('Error starting audio stream:', error);
    updateStatus('error', 'ERROR: ' + error.message);
  }
}

// Stop audio streaming
function stopStreaming() {
  isRecording = false;

  // Clear text mode silent frame intervals
  if (window.textModeIntervals) {
    window.textModeIntervals.forEach(interval => clearInterval(interval));
    window.textModeIntervals = [];
  }

  if (processor) {
    processor.disconnect();
    processor = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
}

// Connect to WebSocket
async function connect() {
  try {
    updateStatus('connecting', 'CONNECTING');
    
    // Get interaction mode from selector
    if (interactionModeSelect) {
      interviewMode = interactionModeSelect.value;
    }

    // Set connection timeout (10 seconds)
    connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        console.error('Connection timeout - Deepgram may have rejected the connection');
        updateStatus('error', 'ERROR: Connection timeout. Check Deepgram API key.');
        disconnect();
      }
    }, 10000);

    // Create audio context for playback (always needed for agent responses)
    // Firefox: Use native sample rate to avoid mismatch error
    // Chrome/Safari: Use 16000 Hz for microphone input
    if (isFirefox) {
      audioContext = new AudioContext({
      });
    } else {
      audioContext = new AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive' // Optimize for low latency real-time audio
      });
    }

    // Only request microphone if in speech mode
    if (interviewMode === 'speech') {
      // Browser-specific audio constraints
      let audioConstraints;

      if (isFirefox) {
        audioConstraints = {
          channelCount: 1, // Force 1 channel for microphone input, mono recommended for better audio quality (not guaranteed in Firefox)
          echoCancellation: true, // set to true for desktop microphones also works with headsets
          noiseSuppression: false, // firefox ignores this
        };
      } else {
        // Chrome/Edge/Safari: Full constraints with Google-specific options
        audioConstraints = {
          channelCount: 1, // Force 1 channel for microphone input, mono recommended for better audio quality
          echoCancellation: true, // set to true for desktop microphones also works with headsets
          noiseSuppression: true, // set to true for desktop microphones also works with headsets
        };
      }

      const constraints = {
        audio: audioConstraints
      };

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    updateStatus('connecting', 'CONNECTING');

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/agent/converse`;
    socket = new WebSocket(wsUrl);

    // Set binary type - some browsers work better with 'blob', others with 'arraybuffer'
    // We handle both in onmessage for maximum compatibility
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      console.log('WebSocket connected');
      isConnected = true;
      // Don't update status here - wait for Welcome message
    };

    socket.onmessage = async (event) => {
      // Handle both Blob and ArrayBuffer for better browser compatibility
      if (event.data instanceof Blob) {
        // Binary audio data as Blob (some browsers send as Blob)
        try {
          const arrayBuffer = await event.data.arrayBuffer();
          playAudio(arrayBuffer);
        } catch (error) {
          console.error('Error processing audio response:', error);
        }
      } else if (event.data instanceof ArrayBuffer) {
        // Binary audio data as ArrayBuffer (direct binary)
        try {
          playAudio(event.data);
        } catch (error) {
          console.error('Error processing audio:', error);
        }
      } else {
        // JSON message
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          if (message.type === 'Welcome') {
            // Clear connection timeout on successful connection
            if (connectionTimeout) {
              clearTimeout(connectionTimeout);
              connectionTimeout = null;
            }
            
            updateStatus('connected', 'CONNECTED');

            // Get current interview configuration
            interviewConfig.role = roleSelect.value;
            interviewConfig.customRole = (roleSelect.value === 'custom' && customRoleInput) ? customRoleInput.value.trim() : '';
            interviewConfig.companyName = companyNameInput ? companyNameInput.value.trim() : '';
            interviewConfig.interviewType = interviewTypeSelect.value;
            interviewConfig.difficulty = difficultySelect.value;
            interviewConfig.resumeContent = resumeContent;

            // Generate interview prompt based on configuration
            const interviewPrompt = generateInterviewPrompt(interviewConfig);

            // Send Settings message
            const settings = {
              type: 'Settings',
              audio: {
                input: {
                  encoding: 'linear16',
                  sample_rate: audioContext.sampleRate // Use actual AudioContext rate
                },
                output: {
                  encoding: 'linear16',
                  sample_rate: 24000, // Keep output at 24000 for all browsers
                  container: 'none' // Request raw PCM without container/headers for manual audio processing
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
                  prompt: interviewPrompt + (interviewMode === 'text' ? '\n\nNOTE: The candidate will be typing their responses, not speaking. Keep your questions clear and wait for their text input.' : '')
                },
                speak: {
                  provider: {
                    type: 'deepgram',
                    model: 'aura-2-orpheus-en'
                  }
                },
                greeting: getInterviewGreeting(interviewConfig)
              }
            };

            socket.send(JSON.stringify(settings));
          } else if (message.type === 'SettingsApplied') {
            updateStatus('connected', 'CONNECTED');
            startInterviewTimer();
            startStreaming();
          } else if (message.type === 'ConversationText') {
            // Add message to conversation history
            addMessage(message.role, message.content);
            // Ensure text response container stays visible in text mode
            if (interviewMode === 'text' && textResponseContainer) {
              textResponseContainer.style.display = 'block';
            }
          } else if (message.type === 'Error') {
            console.error('Agent error:', message);
            updateStatus('error', 'ERROR: ' + message.description);
          } else if (message.type === 'UserStartedSpeaking') {
            updateStatus('connected', 'CONNECTED');
            userSpeakingStartTime = Date.now();
            
            // Check for rambling after 90 seconds
            setTimeout(() => {
              if (userSpeakingStartTime && (Date.now() - userSpeakingStartTime) >= 90000) {
                sendInterruptionSignal();
              }
            }, 90000);
          } else if (message.type === 'UserStoppedSpeaking') {
            userSpeakingStartTime = null;
          } else if (message.type === 'AgentThinking') {
            updateStatus('connected', 'CONNECTED');
            userSpeakingStartTime = null; // Reset speaking timer
          } else if (message.type === 'AgentAudioDone') {
            updateStatus('connected', 'CONNECTED');
            // Ensure text response container stays visible in text mode
            if (interviewMode === 'text' && textResponseContainer) {
              textResponseContainer.style.display = 'block';
            }
          } else if (message.type === 'InjectionRefused') {
            console.warn('Message injection was refused - user may be speaking or agent responding');
            updateStatus('connected', 'CONNECTED - Message not sent (agent is speaking or user is talking)');
            // Auto-clear the status message after 3 seconds
            setTimeout(() => {
              updateStatus('connected', 'CONNECTED');
            }, 3000);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateStatus('error', 'ERROR: Connection error');
      disconnect();
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      isConnected = false;
      updateStatus('disconnected', 'DISCONNECTED');
      disconnect();
    };

  } catch (error) {
    console.error('Error connecting:', error);
    updateStatus('error', 'ERROR: ' + error.message);
    disconnect();
  }
}

// Disconnect
function disconnect() {
  stopStreaming();
  clearScheduledAudio();
  stopInterviewTimer();

  // Clear connection timeout
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
  
  // Hide text response container
  if (textResponseContainer) {
    textResponseContainer.style.display = 'none';
  }

  isConnected = false;
  updateStatus('disconnected', 'DISCONNECTED');
}

// Clear conversation history
function clearConversation() {
  conversationHistory.innerHTML = '';
  resetInterviewStats();
}

// Button click handlers
startButton.addEventListener('click', () => {
  if (!isConnected) {
    connect();
  }
});

endButton.addEventListener('click', () => {
  if (isConnected) {
    disconnect();
  }
});

cancelButton.addEventListener('click', () => {
  disconnect();
  clearConversation();
});

sendButton.addEventListener('click', () => {
  sendTextMessage();
});

// Send text message via Enter key
injectUserMessageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !sendButton.disabled) {
    sendTextMessage();
  }
});

// Send text message to agent
function sendTextMessage() {
  const message = injectUserMessageInput.value.trim();

  if (!message || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  // Send InjectUserMessage to agent
  const injectMessage = {
    type: 'InjectUserMessage',
    content: message
  };

  socket.send(JSON.stringify(injectMessage));

  // Don't add to UI optimistically - wait for ConversationText event from Deepgram
  // This prevents duplicate messages when Deepgram echoes back the user message

  // Clear input
  injectUserMessageInput.value = '';
}

// Send text response (for text mode interviews)
function sendTextResponse() {
  if (!textResponseInput) return;
  
  const message = textResponseInput.value.trim();

  if (!message || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  // Send InjectUserMessage to agent
  const injectMessage = {
    type: 'InjectUserMessage',
    content: message
  };

  socket.send(JSON.stringify(injectMessage));

  // Clear input
  textResponseInput.value = '';
  
  // Disable button briefly to prevent spam
  if (sendResponseButton) {
    sendResponseButton.disabled = true;
    setTimeout(() => {
      sendResponseButton.disabled = false;
    }, 1000);
  }
}

// Text response button handler
if (sendResponseButton) {
  sendResponseButton.addEventListener('click', () => {
    sendTextResponse();
  });
}

// Send text response via Enter key
if (textResponseInput) {
  textResponseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextResponse();
    }
  });
}

// Handle resume file upload
if (resumeUpload) {
  resumeUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      resumeContent = '';
      if (resumeFileName) resumeFileName.textContent = 'No file selected';
      return;
    }

    if (resumeFileName) {
      resumeFileName.textContent = `Selected: ${file.name}`;
      resumeFileName.style.color = '#13ef95';
    }

    try {
      if (file.type === 'application/pdf') {
        // For PDF, we'll use a simple extraction approach
        // Note: This requires pdf.js library or a backend service
        // For now, we'll show a message that PDF parsing needs a library
        resumeContent = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        // Simple text file
        resumeContent = await file.text();
      } else {
        alert('Please upload a PDF or TXT file');
        resumeContent = '';
        if (resumeFileName) resumeFileName.textContent = 'Invalid file type';
        return;
      }

      console.log('Resume loaded:', resumeContent.substring(0, 200) + '...');
    } catch (error) {
      console.error('Error reading resume:', error);
      alert('Error reading resume file. Please try again.');
      resumeContent = '';
      if (resumeFileName) resumeFileName.textContent = 'Error reading file';
    }
  });
}

// Extract text from PDF file
async function extractTextFromPDF(file) {
  // Check if PDF.js is loaded
  if (typeof pdfjsLib === 'undefined') {
    // Fallback: Ask user to provide text version
    alert('PDF parsing library not loaded. Please upload a .txt version of your resume instead, or we\'ll conduct a general interview.');
    return '';
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}

// Toggle custom role input visibility
if (roleSelect) {
  roleSelect.addEventListener('change', () => {
    const customRoleContainer = document.getElementById('customRoleInputContainer');
    if (customRoleContainer) {
      customRoleContainer.style.display = roleSelect.value === 'custom' ? 'block' : 'none';
    }
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  disconnect();
});

// Generate interview prompt based on configuration
function generateInterviewPrompt(config) {
  const roleNames = {
    software_engineer: 'Software Engineer',
    frontend_developer: 'Frontend Developer',
    backend_developer: 'Backend Developer',
    data_scientist: 'Data Scientist',
    product_manager: 'Product Manager',
    devops_engineer: 'DevOps Engineer',
    full_stack_developer: 'Full Stack Developer',
    ml_engineer: 'Machine Learning Engineer',
    custom: config.customRole || 'Software Engineer'
  };

  const roleName = roleNames[config.role] || 'Software Engineer';
  const companyName = config.companyName || 'a growing tech company';
  
  let interviewFocus = '';
  if (config.interviewType === 'behavioral') {
    interviewFocus = `Focus on behavioral questions using the STAR method (Situation, Task, Action, Result). Ask about:
- Challenging projects and how they handled them
- Team collaboration and conflict situations
- Leadership moments and taking initiative
- Failure experiences and what they learned
- Time management and prioritization under pressure
- Communication with stakeholders and cross-functional teams

Ask follow-up questions like: "Can you elaborate on that?", "What was the outcome?", "What would you do differently?", "How did the team react?"`;
  } else if (config.interviewType === 'technical') {
    interviewFocus = `Focus on technical depth appropriate for the level:
- Problem-solving approach and thought process
- Data structures and algorithms (explain trade-offs)
- Code quality, testing, and best practices
- Debugging strategies and troubleshooting
- Technology choices and architectural decisions
- Performance optimization and scalability considerations

Ask them to explain their reasoning: "Why would you choose that approach?", "What are the trade-offs?", "How would you optimize this?", "What edge cases should we consider?"`;
  } else if (config.interviewType === 'system_design') {
    interviewFocus = `Focus on system design with realistic constraints:
- Clarify requirements and scope first
- Scalability, reliability, and performance trade-offs
- Database design and data flow
- API design and service communication
- Monitoring, logging, and error handling
- Cost considerations and infrastructure choices

Guide with questions: "How many users are we expecting?", "What are the availability requirements?", "How would you handle failures?", "What about data consistency?"`;
  } else {
    interviewFocus = `Mix behavioral and technical questions naturally:
- Start with behavioral to understand their experience
- Transition to technical discussions based on their background
- Connect technical questions to real project scenarios
- Ask how they've applied concepts in practice`;
  }

  const experienceLevel = {
    entry: 'entry-level position (0-2 years)',
    mid: 'mid-level position (3-5 years)',
    senior: 'senior position (6-10 years)',
    lead: 'lead/principal position (10+ years)'
  }[config.difficulty] || 'mid-level position';

  // Add resume context if available
  const resumeContext = config.resumeContent ? `

CANDIDATE'S RESUME/BACKGROUND:
${config.resumeContent.substring(0, 3000)}

Use the above resume to:
- Ask specific questions about their listed experiences and projects
- Probe deeper into technologies and skills they mention
- Reference their past roles and accomplishments naturally
- Tailor questions to match their background and expertise level
- Connect their experience to the role they're interviewing for
` : '';

  return `You are Alex Chen, a Senior Engineering Manager with 12 years of experience, conducting a real interview for a ${roleName} ${experienceLevel} at ${companyName}.
${resumeContext}

${interviewFocus}

Your interviewing style:
- Be warm, professional, and genuinely curious about their experiences
- Build rapport - smile in your voice, use their name occasionally if they give it
- Take brief pauses as if taking notes (use phrases like "Let me jot that down" or "That's interesting")
- React naturally to answers with authentic responses: "Oh, I see", "That's a great point", "Hmm, interesting approach", "I've dealt with similar situations"
- If they give a great answer, acknowledge it: "That's exactly what we're looking for" or "Great example"
- If an answer needs more depth, probe gently: "Can you tell me more about...", "What was your specific role in that?"
- Share brief context when asking questions to make them feel natural: "We often face X situation here, how would you..."
- **Gently interrupt if they ramble**: When prompted by system, use phrases like "That's helpful, but let me stop you there...", "I appreciate all that detail, but let me ask specifically...", "Let me redirect you for a moment..."
- **Show active listening**: Repeat key points back: "So what I'm hearing is...", "It sounds like you...", "If I understand correctly..."
- **Encourage nervous candidates**: "You're doing great, by the way", "Don't worry, you're on the right track", "Take your time"
- **Natural time management**: When system indicates time, mention it naturally: "We're about halfway through", "We have about 5 minutes left"
- **Acknowledge good thinking**: "That's smart", "I like that approach", "Good instinct"
- **Use thinking pauses**: "Hmm, let me think...", "That's interesting...", brief natural pauses
- **Clarify when needed**: "Just to make sure I understand...", "Can you clarify what you mean by..."

Interview structure:
1. Start with warm welcome and brief small talk (ask how they're doing, maybe comment on their location/background)
2. Introduce yourself briefly (mention you're a Senior Engineering Manager, maybe your team)
3. Set expectations: "This will be conversational, about 15-20 minutes, I'll ask about your experience and approach to problems"
4. Ask them to introduce themselves and walk through their background (encourage them: "Take your time")
5. Ask 4-6 well-crafted questions based on the interview type
6. Transition naturally between topics using their answers ("That reminds me...", "Speaking of...")
7. Check in mid-interview: "You're doing well so far" or casual time mention
8. After 12-15 minutes, start wrapping up: "We're coming up on time, so let me ask one more question"
9. End by asking if they have questions for you (answer 1-2 authentically)
10. Thank them warmly and give next steps: "Thanks so much, you'll hear from our team within a week. Really enjoyed talking with you!"

Critical voice interview behaviors:
- Keep responses conversational, not scripted - sound like a real person
- Vary your phrasing - don't sound repetitive or robotic
- Show engagement through verbal cues: "Mm-hmm", "Right", "Okay", "I see"
- Don't rush - let natural silence happen while they think (count to 3)
- If they're struggling, offer a hint or rephrase: "Let me ask it differently..."
- Adapt your tone based on their energy level - match their enthusiasm
- Use filler words naturally: "um", "uh", "you know", "right", "so"
- Show you're thinking: "Hmm...", "Let me see...", "Good question..."
- React to their emotion: If excited, match it; if nervous, be reassuring
- Laugh lightly at appropriate moments: "Ha, yeah, I've been there"
- Build on their answers: "That's actually similar to something we're working on..."

Question quality:
- Make questions specific, not generic
- Base follow-ups on what they actually said
- Don't ask obvious yes/no questions
- Avoid multiple questions at once
- If they mention a technology, ask them to explain their experience with it

Remember: You're evaluating them, but also selling the company. Be encouraging and make them feel respected.`;
}

// Get interview greeting based on configuration
function getInterviewGreeting(config) {
  const roleNames = {
    software_engineer: 'Software Engineer',
    frontend_developer: 'Frontend Developer',
    backend_developer: 'Backend Developer',
    data_scientist: 'Data Scientist',
    product_manager: 'Product Manager',
    devops_engineer: 'DevOps Engineer',
    full_stack_developer: 'Full Stack Developer',
    ml_engineer: 'Machine Learning Engineer',
    custom: config.customRole || 'Software Engineer'
  };

  const roleName = roleNames[config.role] || 'Software Engineer';
  const companyName = config.companyName || 'our company';
  
  // If resume is provided, acknowledge it briefly
  const resumeAcknowledgment = config.resumeContent ? " I've had a chance to review your resume, which looks great." : "";
  
  return `Hi there! Thanks for joining me today. How are you doing? Good! So, I'm Alex, I'm a Senior Engineering Manager here at ${companyName}, and I'll be interviewing you for the ${roleName} position.${resumeAcknowledgment} This should be pretty conversational - I'd say about 15 to 20 minutes. I'm going to ask you about your background and experience, maybe dive into some technical topics, and then leave some time for your questions at the end. Sound good? Great! So let's start - why don't you tell me a bit about yourself and what brings you to this role?`;
}
