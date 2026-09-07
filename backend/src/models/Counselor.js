const mongoose = require('mongoose');

const counselorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  qualifications: {
    type: [String],
    default: [],
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  maxCaseload: {
    type: Number,
    default: 10,
    required: true,
  },
  currentCaseload: {
    type: Number,
    default: 0,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Counselor', counselorSchema);
