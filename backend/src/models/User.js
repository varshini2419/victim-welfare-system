const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['victim', 'counselor', 'admin'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
