const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    trim: true,
    default: 'New Conversation',
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
