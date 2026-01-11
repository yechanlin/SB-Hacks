# AI Mock Interview Agent

An intelligent interview practice platform powered by Deepgram's Voice Agent API. Features real-time voice or text-based interviews with AI-driven behavioral and technical questions, resume analysis, and interview coaching.

## Features

- Real-time voice and text interview modes
- Resume upload with PDF/TXT support for personalized questions
- Multiple interview types: behavioral, technical, system design, and mixed
- Configurable difficulty levels from entry to lead positions
- Interview time tracking with automatic notifications
- Smart interruption detection for rambling responses
- Live conversation history with transcript display

## Prerequisites

- [Deepgram API Key](https://console.deepgram.com/signup?jump=keys)
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

Create a `.env` file in the root directory:

```bash
DEEPGRAM_API_KEY=your_api_key_here
```

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4
- **Backend**: Node.js with Express
- **Voice AI**: Deepgram Voice Agent API (Speech-to-Text, GPT-4, Text-to-Speech)
- **Audio**: Web Audio API for microphone input and audio playback
- **PDF Processing**: PDF.js for client-side resume parsing

## Getting Help

- [Open an issue in this repository](https://github.com/yechanlin/SB-Hacks/issues/new)
- [Join the Deepgram Github Discussions Community](https://github.com/orgs/deepgram/discussions)
- [Join the Deepgram Discord Community](https://discord.gg/xWRaCDBtW4)

## Contributing

See our [Contributing Guidelines](./CONTRIBUTING.md) to learn about contributing to this project.

## Code of Conduct

This project follows the [Deepgram Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

For security policy and procedures, see our [Security Policy](./SECURITY.md).

## License

MIT - See [LICENSE](./LICENSE)
