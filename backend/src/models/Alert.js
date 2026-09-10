const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  alertType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  eventKey: {
    type: String,
    index: true,
    sparse: true,
    unique: true,
  },
  source: {
    type: String,
    enum: ['EMERGENCY_SOS', 'AI_RISK', 'SYSTEM'],
    default: 'SYSTEM',
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  },
  callLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallLog',
  },
  callStatus: {
    type: String,
    enum: ['PENDING', 'INITIATED', 'COMPLETED', 'FAILED', 'NO_ANSWER'],
  },
  callFailureReason: String,
  status: {
    type: String,
    enum: ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'],
    default: 'NEW'
  },
  acknowledgedAt: Date,
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
