/**
 * Node Voice Agent Starter - Backend Server
 *
 * This is a simple Express server that provides a voice agent API endpoint
 * powered by Deepgram's Voice Agent service. It's designed to be easily
 * modified and extended for your own projects.
 *
 * Key Features:
 * - Single API endpoint: POST /agent/converse
 * - Proxies to Vite dev server in development
 * - Serves static frontend in production
 * - Creates a WebSocket server for the voice agent
 */

import { createClient } from '@deepgram/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WebSocketServer } from 'ws';
import express from 'express';
import { createServer } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  vitePort: process.env.VITE_PORT || 5173,
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Validate required environment variables
if (!CONFIG.deepgramApiKey) {
  console.error('Error: DEEPGRAM_API_KEY not found in environment variables');
  process.exit(1);
}

// Initialize Express
const app = express();

// Middleware for JSON parsing (needed for API endpoints)
app.use(express.json());

// Hardcoded LeetCode Problem: Two Sum
const LEETCODE_PROBLEM = {
  title: 'Two Sum',
  difficulty: 'Easy',
  description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
  functionSignature: {
    javascript: `function twoSum(nums, target) {
    // We need to find two numbers that add up to target
    // Return their indices as an array
    
    return [];
}`,
    python: `def twoSum(nums, target):
    # We need to find two numbers that add up to target
    # Return their indices as a list
    
    return []`,
    java: `public int[] twoSum(int[] nums, int target) {
    // We need to find two numbers that add up to target
    // Return their indices as an array
    
    return new int[0];
}`,
    cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // We need to find two numbers that add up to target
    // Return their indices as a vector
    
    return {};
}`,
    csharp: `public int[] TwoSum(int[] nums, int target) {
    // We need to find two numbers that add up to target
    // Return their indices as an array
    
    return new int[0];
}`,
    go: `func twoSum(nums []int, target int) []int {
    // We need to find two numbers that add up to target
    // Return their indices as a slice
    
    return []int{}
}`,
    rust: `pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // We need to find two numbers that add up to target
    // Return their indices as a vector
    
    vec![]
}`,
    typescript: `function twoSum(nums: number[], target: number): number[] {
    // We need to find two numbers that add up to target
    // Return their indices as an array
    
    return [];
}`,
    ruby: `def two_sum(nums, target)
  # We need to find two numbers that add up to target
  # Return their indices as an array
  
  []
end`,
    php: `function twoSum($nums, $target) {
    // We need to find two numbers that add up to target
    // Return their indices as an array
    
    return [];
}`,
  }
};

// API endpoint to get the LeetCode problem
app.get('/api/problem', (req, res) => {
  res.json(LEETCODE_PROBLEM);
});

// API endpoint to check code solution with Gemini
app.post('/api/check-code', async (req, res) => {
  try {
    if (!CONFIG.geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const { code, language, problemStatement } = req.body;

    if (!code || !language || !problemStatement) {
      return res.status(400).json({ error: 'Missing required fields: code, language, problemStatement' });
    }

    const genAI = new GoogleGenerativeAI(CONFIG.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a technical interview evaluator. A candidate has submitted their solution to this LeetCode problem:

${problemStatement}

Their solution in ${language}:
\`\`\`${language}
${code}
\`\`\`

Please evaluate this solution and provide feedback in this EXACT format:

FIRST, determine if the code will RUN without syntax errors (YES/NO/PARTIAL)
SECOND, determine if the code correctly SOLVES the problem (YES/NO/PARTIAL)

Then provide feedback:
- If the code will NOT run: Explain the syntax/logic errors clearly
- If the code will run but is INCORRECT: Explain what's wrong and provide a helpful hint (1-2 sentences) to guide them. Don't give away the solution directly.
- If the code is CORRECT: Confirm it and ask them to explain their approach or discuss time/space complexity.

Format your response as a brief, conversational message that an interviewer would speak to the candidate. Be encouraging but direct. Start by stating whether the code will run, then provide your feedback.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text();

    res.json({ feedback, success: true });
  } catch (error) {
    console.error('Error checking code with Gemini:', error);
    res.status(500).json({ error: 'Error checking code: ' + error.message });
  }
});

// Development: Proxy to Vite dev server (exclude /api routes)
// Production: Serve static files
if (CONFIG.isDevelopment) {
  console.log(`Development mode: Proxying to Vite dev server on port ${CONFIG.vitePort}`);
  app.use(
    '/',
    createProxyMiddleware({
      target: `http://localhost:${CONFIG.vitePort}`,
      changeOrigin: true,
      ws: true, // Enable WebSocket proxying for Vite HMR
    })
  );
} else {
  console.log('Production mode: Serving static files from frontend/dist');
  const distPath = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(distPath));
}

// Create HTTP server
const server = createServer(app);

// Enable proper port cleanup on Linux
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${CONFIG.port} is already in use.`);
    console.error('Run "pnpm run cleanup" to kill orphaned processes.\n');
    process.exit(1);
  }
  throw err;
});

// Create WebSocket server with path filtering
const wss = new WebSocketServer({
  server,
  path: '/agent/converse'
});

// Handle WebSocket connections
wss.on('connection', async (clientWs) => {
  console.log('Client connected to /agent/converse');

  let deepgramAgent = null;

  try {
    // Validate API key exists
    if (!CONFIG.deepgramApiKey) {
      clientWs.send(JSON.stringify({
        type: 'Error',
        description: 'Missing Deepgram API key',
        code: 'MISSING_API_KEY'
      }));
      clientWs.close();
      return;
    }

    // Initialize Deepgram client
    const deepgram = createClient(CONFIG.deepgramApiKey);

    // Create agent connection (SDK will establish WebSocket to Deepgram)
    const agent = deepgram.agent();

    // Assign to outer scope variable for use in other handlers
    deepgramAgent = agent;

    // Forward Welcome message from Deepgram to client
    agent.on('Welcome', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Forward SettingsApplied message from Deepgram to client
    agent.on('SettingsApplied', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Forward ConversationText events from Deepgram to client
    agent.on('ConversationText', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Forward UserStartedSpeaking events from Deepgram to client
    agent.on('UserStartedSpeaking', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Forward AgentThinking events from Deepgram to client
    agent.on('AgentThinking', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Forward AgentAudioDone events from Deepgram to client
    agent.on('AgentAudioDone', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Forward audio chunks from Deepgram to client
    agent.on('Audio', (audioData) => {
      if (clientWs.readyState === 1) {
        clientWs.send(audioData, { binary: true });
      }
    });

    // Forward Error events from Deepgram to client
    agent.on('Error', (error) => {
      console.error('Deepgram agent error:', error);
      if (clientWs.readyState === 1) {
        // Map Deepgram errors to our error codes
        let errorCode = 'PROVIDER_ERROR';
        if (error.message && error.message.includes('auth')) {
          errorCode = 'MISSING_API_KEY';
        } else if (error.message && error.message.includes('audio')) {
          errorCode = 'AUDIO_FORMAT_ERROR';
        }

        clientWs.send(JSON.stringify({
          type: 'Error',
          description: error.message || 'Unknown error occurred',
          code: error.code || errorCode
        }));
      }
    });

    // Forward Warning events from Deepgram to client
    agent.on('Warning', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Forward InjectionRefused events from Deepgram to client
    agent.on('InjectionRefused', (data) => {
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(data));
      }
    });

    // Handle agent close
    agent.on('Close', () => {
      console.log('Deepgram agent connection closed');
      if (clientWs.readyState === 1) {
        clientWs.close();
      }
    });

    // Handle messages from client
    clientWs.on('message', async (data, isBinary) => {
      try {
        if (!deepgramAgent) {
          console.error('Deepgram agent not initialized');
          return;
        }

        if (isBinary) {
          // Binary audio data - validate and forward to Deepgram
          try {
            // Basic validation: check if data is not empty
            if (!data || data.byteLength === 0) {
              clientWs.send(JSON.stringify({
                type: 'Error',
                description: 'Invalid audio data: empty buffer',
                code: 'AUDIO_FORMAT_ERROR'
              }));
              return;
            }
            deepgramAgent.send(data);
          } catch (audioError) {
            console.error('Audio format error:', audioError);
            clientWs.send(JSON.stringify({
              type: 'Error',
              description: 'Invalid audio format',
              code: 'AUDIO_FORMAT_ERROR'
            }));
          }
        } else {
          // JSON message - parse and handle
          const message = JSON.parse(data.toString());

          if (message.type === 'Settings') {
            // Validate Settings message
            if (!message.audio || !message.agent) {
              clientWs.send(JSON.stringify({
                type: 'Error',
                description: 'Invalid Settings message: missing required fields',
                code: 'INVALID_SETTINGS'
              }));
              return;
            }

            // Validate audio configuration
            if (!message.audio.input || !message.audio.output) {
              clientWs.send(JSON.stringify({
                type: 'Error',
                description: 'Invalid Settings message: missing audio configuration',
                code: 'AUDIO_FORMAT_ERROR'
              }));
              return;
            }

            // Validate audio encoding and sample rate
            const validEncodings = ['linear16', 'linear32', 'mulaw'];
            if (!validEncodings.includes(message.audio.input.encoding) ||
              !validEncodings.includes(message.audio.output.encoding)) {
              clientWs.send(JSON.stringify({
                type: 'Error',
                description: 'Invalid audio encoding format',
                code: 'AUDIO_FORMAT_ERROR'
              }));
              return;
            }

            if (!message.agent.listen || !message.agent.think || !message.agent.speak) {
              clientWs.send(JSON.stringify({
                type: 'Error',
                description: 'Invalid Settings message: missing agent configuration',
                code: 'INVALID_SETTINGS'
              }));
              return;
            }

            // Configure the agent with the provided settings
            deepgramAgent.configure(message);
          } else if (message.type === 'InjectUserMessage') {
            // Use SDK method for injecting user messages
            deepgramAgent.injectUserMessage(message.content);
          } else if (message.type === 'InjectAgentContext') {
            // Handle agent context injection - send as raw message
            // Wrap in try-catch to prevent disconnection on errors
            try {
              // Send as JSON string - this should work based on other usage in the codebase
              deepgramAgent.send(JSON.stringify(message));
              console.log('Agent context injected successfully');
            } catch (contextError) {
              console.error('Error injecting agent context (non-fatal):', contextError);
              // Don't disconnect - just log the error and continue
              // The connection should remain open even if context injection fails
            }
          } else {
            // Forward other JSON messages as-is (send as string, not buffer)
            try {
              deepgramAgent.send(JSON.stringify(message));
            } catch (sendError) {
              console.error('Error sending message to agent:', sendError);
              // Don't disconnect - just log the error
            }
          }
        }
      } catch (error) {
        console.error('Error processing client message:', error);
        if (clientWs.readyState === 1) {
          clientWs.send(JSON.stringify({
            type: 'Error',
            description: error.message || 'Error processing message',
            code: 'CONNECTION_FAILED'
          }));
        }
      }
    });

    // Handle client disconnect
    clientWs.on('close', async () => {
      console.log('Client disconnected from /agent/converse');
      if (deepgramAgent) {
        try {
          await deepgramAgent.disconnect();
        } catch (error) {
          console.error('Error disconnecting Deepgram agent:', error);
        }
      }
    });

    // Handle client errors
    clientWs.on('error', (error) => {
      console.error('Client WebSocket error:', error);
    });

  } catch (error) {
    console.error('Error initializing agent connection:', error);
    if (clientWs.readyState === 1) {
      clientWs.send(JSON.stringify({
        type: 'Error',
        description: 'Failed to initialize agent connection',
        code: 'CONNECTION_FAILED'
      }));
      clientWs.close();
    }
  }
});

// Start the server
server.listen(CONFIG.port, CONFIG.host, () => {
  console.log(`Server running at http://localhost:${CONFIG.port}`);
  console.log(`WebSocket endpoint: ws://localhost:${CONFIG.port}/agent/converse`);
  if (CONFIG.isDevelopment) {
    console.log(`Make sure Vite dev server is running on port ${CONFIG.vitePort}`);
    console.log(`\n⚠️  Open your browser to http://localhost:${CONFIG.port}`);
  }
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down server...');

  wss.clients.forEach((client) => {
    try {
      client.close();
    } catch (err) {
      console.error('Error closing client:', err);
    }
  });

  wss.close(() => {
    console.log('WebSocket server closed');
  });

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 2 seconds (reduced for faster cleanup)
  setTimeout(() => {
    console.error('Force closing');
    process.exit(0); // Exit cleanly
  }, 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown();
});

export default server;
