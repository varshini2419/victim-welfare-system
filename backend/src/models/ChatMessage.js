const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true,
  },
  senderType: {
    type: String,
    enum: ['victim', 'ai', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  isFlagged: {
    type: Boolean,
    default: false,
  },
  // Future compatibility fields for Sentiment/Emotion AI
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
