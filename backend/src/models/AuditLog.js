const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String, // 'Case', 'User', 'Document', etc.
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  caseId: {
    type: String, // Readable Case ID ARH-2026-...
  },
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
