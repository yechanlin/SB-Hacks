# Database Design for Interview Agent

## MongoDB Schema Design

### 1. Sessions Collection
Store interview session metadata and configuration.

```javascript
{
  _id: ObjectId,
  sessionId: String (unique),
  userId: String (optional - for future user system),
  config: {
    role: String,
    customRole: String,
    companyName: String,
    interviewType: String, // 'behavioral', 'technical', etc.
    difficulty: String, // 'easy', 'mid', 'hard'
    interactionMode: String // 'speech', 'text'
  },
  resume: {
    fileName: String,
    content: String
  },
  startTime: Date,
  endTime: Date,
  duration: Number, // milliseconds
  status: String, // 'in_progress', 'completed', 'abandoned'
  statistics: {
    questionCount: Number,
    totalMessages: Number,
    userMessages: Number,
    agentMessages: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Conversations Collection
Store individual messages within a session.

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: Sessions),
  role: String, // 'user', 'assistant'
  content: String,
  timestamp: Date,
  messageIndex: Number, // order within session
  metadata: {
    isQuestion: Boolean,
    speakingDuration: Number (optional - for user messages)
  },
  createdAt: Date
}
```

### 3. Reports Collection
Store generated feedback reports for sessions.

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: Sessions),
  reportType: String, // 'summary', 'detailed', 'feedback'
  generatedAt: Date,
  content: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    scores: {
      overall: Number,
      communication: Number,
      technical: Number,
      behavior: Number
    },
    statistics: {
      totalDuration: Number,
      questionCount: Number,
      averageResponseTime: Number
    }
  },
  createdAt: Date
}
```

## API Endpoints Needed

### REST Endpoints

1. **POST /api/sessions**
   - Create a new interview session
   - Body: { config, resume }
   - Returns: { sessionId, ... }

2. **GET /api/sessions/:sessionId**
   - Get session details
   - Returns: { session, conversations, report }

3. **POST /api/sessions/:sessionId/conversations**
   - Add a conversation message (can be called multiple times)
   - Body: { role, content, timestamp }
   - Returns: { success: true }

4. **PUT /api/sessions/:sessionId/end**
   - Mark session as completed
   - Body: { endTime, statistics }
   - Returns: { session }

5. **POST /api/sessions/:sessionId/reports**
   - Generate and store feedback report
   - Body: { reportType, content }
   - Returns: { report }

6. **GET /api/sessions/:sessionId/report**
   - Get the latest report for a session
   - Returns: { report }
