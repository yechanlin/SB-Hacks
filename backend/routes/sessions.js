import express from 'express';
import Session from '../models/Session.js';
import Conversation from '../models/Conversation.js';
import Report from '../models/Report.js';

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

export default router;
