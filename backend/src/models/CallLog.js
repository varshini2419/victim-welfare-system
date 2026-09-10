const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true,
  },
  counselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    required: true,
    index: true,
  },
  riskEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    required: true,
    index: true,
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ['HIGH', 'CRITICAL'],
    required: true,
  },
  callType: {
    type: String,
    enum: ['VICTIM_SOS', 'AI_HIGH_RISK', 'AI_CRITICAL_RISK'],
    required: true,
  },
  callStatus: {
    type: String,
    enum: ['PENDING', 'INITIATED', 'COMPLETED', 'FAILED', 'NO_ANSWER'],
    default: 'PENDING',
    index: true,
  },
  providerCallId: {
    type: String,
    index: true,
    sparse: true,
  },
  failureReason: String,
  initiatedAt: Date,
  answeredAt: Date,
  completedAt: Date,
}, {
  timestamps: true,
});

callLogSchema.index({ riskEventId: 1, counselorId: 1 }, { unique: true });

module.exports = mongoose.model('CallLog', callLogSchema);
