import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    default: null
  },
  config: {
    role: String,
    customRole: String,
    companyName: String,
    interviewType: {
      type: String,
      enum: ['behavioral', 'technical', 'mixed'],
      default: 'behavioral'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'mid', 'hard'],
      default: 'mid'
    },
    interactionMode: {
      type: String,
      enum: ['speech', 'text'],
      default: 'speech'
    }
  },
  resume: {
    fileName: String,
    content: String
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // milliseconds
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  statistics: {
    questionCount: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    userMessages: {
      type: Number,
      default: 0
    },
    agentMessages: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Generate sessionId before saving
sessionSchema.pre('save', function (next) {
  if (!this.sessionId) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Calculate duration before saving
sessionSchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  next();
});

export default mongoose.model('Session', sessionSchema);
