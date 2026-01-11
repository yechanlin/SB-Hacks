import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Session from '../models/Session.js';
import Conversation from '../models/Conversation.js';
import Report from '../models/Report.js';

dotenv.config();

const router = express.Router();

// POST /api/sessions - Create a new interview session
router.post('/', async (req, res) => {
  try {
    const { config, resume } = req.body;

    const session = new Session({
      config: config || {},
      resume: resume || {},
      status: 'in_progress',
      startTime: new Date()
    });

    await session.save();

    res.status(201).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        _id: session._id,
        config: session.config,
        startTime: session.startTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create session'
    });
  }
});

// GET /api/sessions/:sessionId - Get session details with conversations and report
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Get conversations for this session
    const conversations = await Conversation.find({ sessionId: session._id })
      .sort({ messageIndex: 1 });

    // Get latest report for this session
    const report = await Report.findOne({ sessionId: session._id })
      .sort({ generatedAt: -1 });

    res.json({
      success: true,
      session,
      conversations,
      report: report || null
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch session'
    });
  }
});

// GET /api/sessions/:sessionId/conversations - Get all conversations for a session (debug endpoint)
router.get('/:sessionId/conversations', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const conversations = await Conversation.find({ sessionId: session._id })
      .sort({ messageIndex: 1 });

    console.log(`📊 Found ${conversations.length} conversations for session ${sessionId}`);

    res.json({
      success: true,
      sessionId: session.sessionId,
      sessionStatus: session.status,
      count: conversations.length,
      conversations: conversations.map(c => ({
        role: c.role,
        content: c.content.substring(0, 100) + (c.content.length > 100 ? '...' : ''),
        timestamp: c.timestamp,
        messageIndex: c.messageIndex,
        metadata: c.metadata
      }))
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch conversations'
    });
  }
});

// POST /api/sessions/:sessionId/conversations - Add a conversation message
router.post('/:sessionId/conversations', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content, timestamp, metadata } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: role, content'
      });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Get current message count for this session
    const messageCount = await Conversation.countDocuments({ sessionId: session._id });

    const conversation = new Conversation({
      sessionId: session._id,
      role,
      content,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      messageIndex: messageCount,
      metadata: metadata || {}
    });

    await conversation.save();

    console.log(`💾 Saved conversation to DB: ${role} - ${content.substring(0, 50)}... (sessionId: ${sessionId}, messageIndex: ${messageCount})`);

    // Update session statistics
    session.statistics.totalMessages += 1;
    if (role === 'user') {
      session.statistics.userMessages += 1;
    } else if (role === 'assistant') {
      session.statistics.agentMessages += 1;
      if (metadata?.isQuestion) {
        session.statistics.questionCount += 1;
      }
    }
    await session.save();

    res.status(201).json({
      success: true,
      conversation: {
        _id: conversation._id,
        role: conversation.role,
        content: conversation.content,
        timestamp: conversation.timestamp,
        messageIndex: conversation.messageIndex
      }
    });
  } catch (error) {
    console.error('Error adding conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add conversation'
    });
  }
});

// PUT /api/sessions/:sessionId/end - Mark session as completed
router.put('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { statistics } = req.body;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.status = 'completed';
    session.endTime = new Date();

    if (statistics) {
      session.statistics = { ...session.statistics, ...statistics };
    }

    // Calculate duration
    if (session.endTime && session.startTime) {
      session.duration = session.endTime.getTime() - session.startTime.getTime();
    }

    await session.save();

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end session'
    });
  }
});

// POST /api/sessions/:sessionId/reports - Generate and store feedback report
router.post('/:sessionId/reports', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reportType, content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content'
      });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const report = new Report({
      sessionId: session._id,
      reportType: reportType || 'feedback',
      content,
      generatedAt: new Date()
    });

    await report.save();

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create report'
    });
  }
});

// GET /api/sessions/:sessionId/report - Get latest report for a session
router.get('/:sessionId/report', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const report = await Report.findOne({ sessionId: session._id })
      .sort({ generatedAt: -1 });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found for this session'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report'
    });
  }
});

// POST /api/sessions/:sessionId/feedback/generate - Generate feedback using OpenAI API
router.post('/:sessionId/feedback/generate', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Session must be completed before generating feedback'
      });
    }

    // Fetch all conversations for this session
    const conversations = await Conversation.find({ sessionId: session._id })
      .sort({ messageIndex: 1 });

    if (conversations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No conversations found for this session'
      });
    }

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({
        success: false,
        error: 'OPENAI_API_KEY not configured'
      });
    }

    // Format conversations for the prompt
    const conversationText = conversations.map((conv) => {
      const role = conv.role === 'user' ? 'Candidate' : 'Interviewer';
      return `${role}: ${conv.content}`;
    }).join('\n\n');

    // Calculate statistics
    const userMessages = conversations.filter(c => c.role === 'user').length;
    const assistantMessages = conversations.filter(c => c.role === 'assistant').length;
    const questions = conversations.filter(c => c.metadata?.isQuestion).length;
    const durationMinutes = session.duration ? Math.round(session.duration / 60000) : 0;

    // Create prompt for OpenAI
    const prompt = `You are an expert interview coach analyzing a mock interview session. Provide detailed, constructive feedback.

Interview Context:
- Role: ${session.config.role || 'Software Engineer'}
- Interview Type: ${session.config.interviewType || 'Behavioral'}
- Difficulty: ${session.config.difficulty || 'Mid'}
- Duration: ${durationMinutes} minutes
- Questions Asked: ${questions}
- Total Messages: ${conversations.length}

Interview Transcript:
${conversationText}

Please provide comprehensive feedback in the following JSON format:
{
  "summary": "A brief 2-3 sentence summary of the overall interview performance",
  "strengths": ["List 3-5 specific strengths observed", "Be specific and reference examples from the conversation"],
  "weaknesses": ["List 3-5 areas for improvement", "Be constructive and specific"],
  "recommendations": ["List 3-5 actionable recommendations", "Be specific about how to improve"],
  "scores": {
    "overall": <number 0-100>,
    "communication": <number 0-100>,
    "technical": <number 0-100>,
    "behavior": <number 0-100>
  }
}

Important: Return ONLY valid JSON, no additional text before or after. The JSON should be parseable.`;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });

    console.log(`Generating feedback for session ${sessionId} using OpenAI...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for cost-effectiveness
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach. Analyze interview sessions and provide constructive feedback. Always return valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const text = completion.choices[0].message.content;

    // Parse JSON from response (OpenAI with response_format: json_object returns pure JSON)
    let feedbackData;
    try {
      // OpenAI with response_format: { type: 'json_object' } returns pure JSON
      feedbackData = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', text);
      // Try to extract JSON if it's wrapped in markdown code blocks (fallback)
      try {
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
        feedbackData = JSON.parse(jsonText);
      } catch (fallbackError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to parse feedback from AI. Please try again.'
        });
      }
    }

    // Validate feedback structure
    if (!feedbackData.summary || !feedbackData.strengths || !feedbackData.weaknesses || !feedbackData.recommendations || !feedbackData.scores) {
      return res.status(500).json({
        success: false,
        error: 'Invalid feedback format from AI'
      });
    }

    // Create report content
    const reportContent = {
      summary: feedbackData.summary,
      strengths: Array.isArray(feedbackData.strengths) ? feedbackData.strengths : [],
      weaknesses: Array.isArray(feedbackData.weaknesses) ? feedbackData.weaknesses : [],
      recommendations: Array.isArray(feedbackData.recommendations) ? feedbackData.recommendations : [],
      scores: {
        overall: feedbackData.scores?.overall || 0,
        communication: feedbackData.scores?.communication || 0,
        technical: feedbackData.scores?.technical || 0,
        behavior: feedbackData.scores?.behavior || 0
      },
      statistics: {
        totalDuration: session.duration || 0,
        questionCount: session.statistics?.questionCount || questions,
        averageResponseTime: userMessages > 0 ? Math.round((session.duration || 0) / userMessages) : 0
      }
    };

    // Save report
    const report = new Report({
      sessionId: session._id,
      reportType: 'feedback',
      content: reportContent,
      generatedAt: new Date()
    });

    await report.save();

    console.log(`Feedback generated successfully for session ${sessionId}`);

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate feedback'
    });
  }
});

export default router;
