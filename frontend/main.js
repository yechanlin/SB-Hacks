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
const interviewTypeSelect = document.getElementById('interviewTypeSelect');
const difficultySelect = document.getElementById('difficultySelect');
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
let interviewConfig = {
  role: 'software_engineer',
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
  
  durationInterval = setInterval(() => {
    const elapsed = Date.now() - interviewStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    interviewDuration.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

// Stop interview timer
function stopInterviewTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
  interviewStatus.textContent = 'Completed';
  interviewStatus.style.color = '#00d4ff';
}

// Reset interview stats
function resetInterviewStats() {
  questionCounter = 0;
  interviewStartTime = null;
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
  interviewStats.style.display = 'none';
  questionsCount.textContent = '0';
  interviewDuration.textContent = '00:00';
  interviewStatus.textContent = 'Ready';
  interviewStatus.style.color = '#ffa500';
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

    // Set connection timeout (10 seconds)
    connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        console.error('Connection timeout - Deepgram may have rejected the connection');
        updateStatus('error', 'ERROR: Connection timeout. Check Deepgram API key.');
        disconnect();
      }
    }, 10000);

    // Create audio context
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
            interviewConfig.interviewType = interviewTypeSelect.value;
            interviewConfig.difficulty = difficultySelect.value;

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
                    model: 'gpt-4o-mini'
                  },
                  prompt: interviewPrompt
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
          } else if (message.type === 'Error') {
            console.error('Agent error:', message);
            updateStatus('error', 'ERROR: ' + message.description);
          } else if (message.type === 'UserStartedSpeaking') {
            updateStatus('connected', 'CONNECTED');
          } else if (message.type === 'AgentThinking') {
            updateStatus('connected', 'CONNECTED');
          } else if (message.type === 'AgentAudioDone') {
            updateStatus('connected', 'CONNECTED');
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
    ml_engineer: 'Machine Learning Engineer'
  };

  const roleName = roleNames[config.role] || 'Software Engineer';
  
  let interviewFocus = '';
  if (config.interviewType === 'behavioral') {
    interviewFocus = 'Focus on behavioral questions using the STAR method (Situation, Task, Action, Result). Ask about past experiences, teamwork, conflict resolution, and leadership.';
  } else if (config.interviewType === 'technical') {
    interviewFocus = 'Focus on technical questions about coding, algorithms, data structures, system architecture, and problem-solving approaches.';
  } else if (config.interviewType === 'system_design') {
    interviewFocus = 'Focus on system design questions. Ask about designing scalable systems, architecture decisions, trade-offs, and distributed systems.';
  } else {
    interviewFocus = 'Mix behavioral questions (using STAR method) with technical questions about coding, architecture, and problem-solving.';
  }

  const experienceLevel = {
    entry: 'entry-level position (0-2 years)',
    mid: 'mid-level position (3-5 years)',
    senior: 'senior position (6-10 years)',
    lead: 'lead/principal position (10+ years)'
  }[config.difficulty] || 'mid-level position';

  return `You are an experienced technical interviewer conducting a mock interview for a ${roleName} ${experienceLevel}.

${interviewFocus}

Interview Guidelines:
- Start with a brief introduction and ask the candidate to tell you about themselves
- Ask one clear question at a time and wait for complete answers
- Follow up on interesting points and dig deeper when appropriate
- Keep questions relevant to the role and experience level
- Be professional, encouraging, and constructive
- If an answer is unclear, ask for clarification or examples
- Naturally transition between topics
- Keep your questions concise and focused
- After 5-7 questions or about 15 minutes, wrap up by asking if they have questions for you

Remember:
- This is a voice interview - keep questions clear and conversational
- Allow the candidate time to think and respond
- Be supportive and create a comfortable environment
- Provide brief acknowledgments ("I see", "That makes sense", "Interesting") to show engagement`;
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
    ml_engineer: 'Machine Learning Engineer'
  };

  const roleName = roleNames[config.role] || 'Software Engineer';
  return `Hello! Welcome to your mock interview for the ${roleName} position. I'm excited to learn more about you today. Let's start with you telling me a bit about yourself and your background.`;
}
