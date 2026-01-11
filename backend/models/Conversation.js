import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  messageIndex: {
    type: Number,
    required: true
  },
  metadata: {
    isQuestion: {
      type: Boolean,
      default: false
    },
    speakingDuration: {
      type: Number, // milliseconds (for user messages)
      default: null
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
conversationSchema.index({ sessionId: 1, messageIndex: 1 });

export default mongoose.model('Conversation', conversationSchema);
