# Rehearse

Voice mock interviews with a demanding AI interviewer. Rehearse runs a timed, real-time interview over Deepgram's Voice Agent API, lets you answer by voice or text, drops a coding problem into an editor for technical rounds, and scores the transcript afterward.

The interviewer persona is "Chad", an Engineering Director who pushes back on vague answers. This project started at SB Hacks.

## Features

- Real-time voice and text interview modes
- Resume upload with PDF/TXT support for personalized questions
- Multiple interview types: behavioral, technical, system design, and mixed
- Configurable difficulty levels from entry to lead positions
- Interview time tracking with automatic notifications
- Smart interruption detection for rambling responses
- Live conversation history with transcript display
- **Session management** - Store and track all interview sessions
- **Conversation persistence** - All conversations are saved to the database
- **AI-powered feedback generation** - Generate comprehensive feedback reports using OpenAI
- **Performance analysis** - Get detailed scores and recommendations after each interview

## Prerequisites

- [Deepgram API Key](https://console.deepgram.com/signup?jump=keys)
- [OpenAI API Key](https://platform.openai.com/api-keys) (for feedback generation)
- MongoDB (local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account)
- Node.js 24.0.0+
- pnpm 10.0.0+

## Setup

**1. Clone and install dependencies**

```bash
git clone https://github.com/yechanlin/SB-Hacks.git
cd SB-Hacks
pnpm install
cd frontend && pnpm install && cd ..
```

**2. Configure environment**

Create a `.env` file in the root directory (you can copy from `sample.env`):

```bash
# Required API Keys
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB - Choose one option:

# Option 1: MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

# Option 2: Local MongoDB (Development)
MONGODB_URI=mongodb://localhost:27017/interview-agent
```

**Notes:**
- Get your Deepgram API key from [Deepgram Console](https://console.deepgram.com/signup?jump=keys)
- Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- For MongoDB Atlas: Create a free cluster and whitelist your IP address
- For local MongoDB: Install MongoDB and ensure it's running on the default port (27017)

**3. Run the application**

Development mode with hot reload:

```bash
pnpm dev
```

Production mode:

```bash
pnpm build
pnpm start
```

**4. Access the application**

Open [http://localhost:3000](http://localhost:3000) in your browser. Use port 3000, not the Vite port printed in the terminal: the Express server on 3000 serves the UI and hosts the WebSocket and API.

## Deployment

The app is a single long-lived Node process: Express serves the built frontend, hosts the REST API, and proxies the Deepgram voice-agent WebSocket. It needs a host that keeps WebSocket connections open, so serverless-only platforms (Vercel functions, Netlify functions) will not run the interview. Render, Railway, and Fly.io all work.

**Render (one click)**

1. Push the repo and create a new Blueprint in Render pointing at it. `render.yaml` defines the service, which builds from the `Dockerfile`.
2. In the service's Environment tab set `DEEPGRAM_API_KEY`, `OPENAI_API_KEY`, and `MONGODB_URI` (a free MongoDB Atlas cluster works; allow access from `0.0.0.0/0` or Render's outbound IPs).
3. Render checks `/healthz` and serves the app on the URL it assigns. Voice mode needs HTTPS for the microphone, which Render provides by default.

**Any Docker host**

```bash
docker build -t rehearse .
docker run -p 3000:3000 \
  -e DEEPGRAM_API_KEY=... -e OPENAI_API_KEY=... -e MONGODB_URI=... \
  rehearse
```

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Monaco editor
- **Backend**: Node.js with Express
- **Database**: MongoDB (with Mongoose ODM)
- **Voice AI**: Deepgram Voice Agent API (Speech-to-Text, GPT-4, Text-to-Speech)
- **Feedback AI**: OpenAI GPT-4o-mini (for generating interview feedback)
- **Audio**: Web Audio API for microphone input and audio playback
- **PDF Processing**: PDF.js for client-side resume parsing

## Backend API

The backend provides RESTful API endpoints for managing interview sessions, conversations, and feedback:

### Session Management
- `POST /api/sessions` - Create a new interview session
- `GET /api/sessions/:sessionId` - Get session details
- `PUT /api/sessions/:sessionId/end` - Mark session as completed

### Conversation Management
- `POST /api/sessions/:sessionId/conversations` - Save a conversation message
- `GET /api/sessions/:sessionId/conversations` - Get all conversations for a session

### Feedback & Reports
- `POST /api/sessions/:sessionId/feedback/generate` - Generate AI-powered feedback using OpenAI
- `GET /api/sessions/:sessionId/report` - Get the latest feedback report for a session

### Coding problem
- `GET /api/problem` - The problem shown in the editor during technical interviews

All conversations are stored in MongoDB during the interview, and feedback is generated using OpenAI's GPT-4o-mini model to provide comprehensive performance analysis.

## Getting Help

- [Open an issue in this repository](https://github.com/yechanlin/SB-Hacks/issues/new)
- [Join the Deepgram Github Discussions Community](https://github.com/orgs/deepgram/discussions)
- [Join the Deepgram Discord Community](https://discord.gg/xWRaCDBtW4)

## Contributing

See our [Contributing Guidelines](./CONTRIBUTING.md) to learn about contributing to this project.

## Code of Conduct

This project follows the [Deepgram Code of Conduct](./CODE_OF_CONDUCT.md).

## License

MIT - See [LICENSE](./LICENSE)

# Acknowledgement

We set this project up based on the [template](https://github.com/deepgram-starters/node-voice-agent) developed by [John Vajda](https://github.com/jpvajda) and  [Naomi Carrigan](https://github.com/naomi-lgbt)