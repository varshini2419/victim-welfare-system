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
    required: true,
    trim: true,
  },
  profession: {
    type: String,
    trim: true,
  },
  qualification: {
    type: String,
    trim: true,
  },
  qualifications: {
    type: [String],
    default: [],
  },
  about: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
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
  },
  specialization: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  experience: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Counselor', counselorSchema);
