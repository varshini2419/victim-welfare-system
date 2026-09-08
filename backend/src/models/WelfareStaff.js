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
  phone: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
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
