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
    enum: ['victim', 'counselor', 'admin', 'WELFARE_OFFICER'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected', 'inactive'],
    required: true,
    index: true,
  },
  state: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
    trim: true,
  },
  registrationId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true,
  },
  otpHash: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  otpUsed: {
    type: Boolean,
    default: false,
  },
  otpAttempts: {
    type: Number,
    default: 0,
  },
  otpLockedUntil: {
    type: Date,
  },
  otpDeliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
  },
  otpSentAt: {
    type: Date,
  },
  otpSendAttempts: {
    type: Number,
    default: 0,
  },
  lastOtpDeliveryError: {
    type: String,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
