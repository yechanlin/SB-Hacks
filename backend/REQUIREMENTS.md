# Interview Feedback System - Requirements

## Goal
Generate AI-powered feedback reports that analyze the entire conversation and provide:
- Feedback on user's answers to interview questions
- Tips to improve interview performance
- Analysis of how the user responded (communication style, clarity, STAR framework usage, etc.)
- Overall assessment and recommendations

## Data Flow

### 1. During Interview (Real-time)
- User and AI interviewer have voice conversation via WebSocket
- Each message (both user and assistant) is stored in database as it happens
- Store: role (user/assistant), content, timestamp, metadata (isQuestion, etc.)

### 2. At End of Interview
- All conversation messages are retrieved from database
- Full conversation history is sent to AI (GEMINI) for analysis
- AI analyzes:
  - User's answers to each question
  - Communication style and clarity
  - STAR framework usage (Situation, Task, Action, Result)
  - Strengths and weaknesses
  - Areas for improvement
  - Specific tips and recommendations

### 3. Report Generation
- AI generates structured feedback report:
  - Summary of performance
  - Strengths (what user did well)
  - Weaknesses (areas to improve)
  - Specific recommendations/tips
  - Scores (overall, communication, technical, behavioral)
  - Statistics (duration, question count, etc.)
- Report is stored in database
- Report is returned to frontend for display

## Database Schema (Confirmed)

### Sessions Collection
- Stores interview session metadata
- Includes: config (role, company, difficulty), resume, timestamps, statistics

### Conversations Collection
- Stores each message in the conversation
- Includes: role (user/assistant), content, timestamp, messageIndex
- All messages for a session can be retrieved for analysis

### Reports Collection
- Stores generated feedback reports
- Includes: summary, strengths, weaknesses, recommendations, scores, statistics

## API Flow

1. **Start Interview**: `POST /api/sessions`
   - Create new session
   - Return sessionId

2. **During Interview**: `POST /api/sessions/:sessionId/conversations`
   - Store each conversation message in real-time
   - Update session statistics

3. **End Interview**: `PUT /api/sessions/:sessionId/end`
   - Mark session as completed
   - Update final statistics

4. **Generate Report**: `POST /api/sessions/:sessionId/reports/generate`
   - Retrieve all conversations for session
   - Send to GEMINI API for analysis
   - Generate structured feedback report
   - Store report in database
   - Return report to frontend

5. **Get Report**: `GET /api/sessions/:sessionId/report`
   - Retrieve latest report for session
   - Display to user

## AI Analysis Prompt (GEMINI)

The AI should analyze:
- All user responses to interview questions
- Communication style (clear, concise, rambling?)
- STAR framework usage (did user provide Situation, Task, Action, Result?)
- Strengths (what they did well)
- Weaknesses (what needs improvement)
- Specific actionable tips
- Overall assessment with scores

## Frontend Integration

- Create session when interview starts
- Send each conversation message to backend API in real-time
- When interview ends, trigger report generation
- Display feedback report to user with:
  - Overall assessment
  - Strengths and weaknesses
  - Recommendations
  - Scores and statistics
