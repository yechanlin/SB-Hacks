import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['summary', 'detailed', 'feedback'],
    default: 'feedback'
  },
  generatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  content: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    scores: {
      overall: {
        type: Number,
        min: 0,
        max: 100
      },
      communication: {
        type: Number,
        min: 0,
        max: 100
      },
      technical: {
        type: Number,
        min: 0,
        max: 100
      },
      behavior: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    statistics: {
      totalDuration: Number,
      questionCount: Number,
      averageResponseTime: Number
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
reportSchema.index({ sessionId: 1, generatedAt: -1 });

export default mongoose.model('Report', reportSchema);
