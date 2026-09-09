const mongoose = require('mongoose');

const emotionAnalysisSchema = new mongoose.Schema({
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    index: true,
  },
  distressScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 20,
  },
  distressBand: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Severe'],
    default: 'Low',
  },
  primaryEmotion: {
    type: String,
    default: 'Calm',
  },
  emotionsBreakdown: {
    Anxious: { type: Number, default: 0 },
    Sad: { type: Number, default: 0 },
    Fearful: { type: Number, default: 0 },
    Angry: { type: Number, default: 0 },
    Calm: { type: Number, default: 0 },
    Hopeful: { type: Number, default: 0 },
    Neutral: { type: Number, default: 0 },
  },
  recentLog: [{
    message: String,
    emotion: String,
    distressScore: Number,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('EmotionAnalysis', emotionAnalysisSchema);
