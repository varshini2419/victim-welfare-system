const mongoose = require('mongoose');

const welfareStaffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  officerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  phone: {
    required: true,
    unique: true,
    index: true,
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  officerType: {
    type: String,
    enum: ['WELFARE_OFFICER'],
    default: 'WELFARE_OFFICER',
    required: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    trim: true,
  },
  specializations: {
    type: [String],
    required: true,
    validate: value => Array.isArray(value) && value.length > 0,
  },
  department: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Victim Welfare Officer', 
      'Rehabilitation Support', 
      'Compensation Assistance', 
      'Legal Aid Coordination', 
      'Social Welfare Support', 
      'Relocation Support', 
      'Protection Coordination', 
      'Other'
    ],
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WelfareStaff', welfareStaffSchema);
