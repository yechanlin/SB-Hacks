# MongoDB Integration Guide

## Summary of What We've Done

### 1. Database Setup ✅
- Added `mongoose` dependency to `package.json`
- Created database connection module (`backend/db.js`)
- Added MongoDB connection to server startup

### 2. Database Models ✅
- **Session Model** (`backend/models/Session.js`): Stores interview session metadata
- **Conversation Model** (`backend/models/Conversation.js`): Stores individual messages
- **Report Model** (`backend/models/Report.js`): Stores generated feedback reports

### 3. API Routes ✅
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:sessionId` - Get session with conversations and report
- `POST /api/sessions/:sessionId/conversations` - Add conversation message
- `PUT /api/sessions/:sessionId/end` - Mark session as completed
- `POST /api/sessions/:sessionId/reports` - Generate and store report
- `GET /api/sessions/:sessionId/report` - Get latest report

## Next Steps

### 4. Integrate WebSocket Handler (TODO)
- Store session when interview starts
- Save conversations in real-time as they occur
- Mark session as completed when interview ends

### 5. Update Frontend (TODO)
- Create session when starting interview
- Send conversations to backend API
- Fetch and display report at end of interview

### 6. Report Generation (TODO)
- Generate feedback report based on conversation data
- Use AI (GEMINI) to analyze conversation and generate feedback
- Store report in database

## Environment Setup

Add to your `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/interview-agent
```

For MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview-agent
```

## Testing

1. Start MongoDB (if using local):
   ```bash
   mongod
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the server:
   ```bash
   pnpm dev
   ```

4. Test API endpoints:
   ```bash
   # Create session
   curl -X POST http://localhost:3000/api/sessions \
     -H "Content-Type: application/json" \
     -d '{"config":{"role":"software_engineer"}}'

   # Add conversation
   curl -X POST http://localhost:3000/api/sessions/SESSION_ID/conversations \
     -H "Content-Type: application/json" \
     -d '{"role":"user","content":"Hello"}'
   ```
