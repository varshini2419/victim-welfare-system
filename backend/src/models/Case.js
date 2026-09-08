const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
    sparse: true, // Only set after approval
  },
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: [
      'Sexual Violence', 
      'Physical Violence', 
      'Murder / Attempted Murder', 
      'Grievous Hurt', 
      'Arson / Property Damage', 
      'Caste-Based Violence / Humiliation', 
      'Threat / Intimidation', 
      'Witness Threat', 
      'Land / Property Related', 
      'Other SC/ST (PoA) Act Related Case',
      'Uncategorized'
    ],
    default: 'Uncategorized'
  },
  firDetails: {
    isFiled: { type: Boolean, default: false },
    firNumber: { type: String, trim: true },
    policeStation: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true }
  },
  supportRequired: [{
    type: String,
    enum: [
      'Counseling',
      'Legal Guidance',
      'Medical Support',
      'Safety / Shelter Support',
      'Welfare Assistance',
      'Other'
    ]
  }],
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'open', 'in-progress', 'resolved', 'closed', 'rejected', 'assigned'],
    default: 'pending',
    index: true,
  },
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  counselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedCounselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    default: null,
  },
  assignedAt: {
    type: Date,
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  documents: [{
    fileName: String,
    originalName: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  rejectionReason: String,
  informationRequest: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('Case', caseSchema);

