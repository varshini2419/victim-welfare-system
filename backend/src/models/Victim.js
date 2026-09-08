const mongoose = require('mongoose');

const victimSchema = new mongoose.Schema({
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
    index: true,
  },
  emergencyContacts: [{
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }
  }],
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  socialCategory: {
    type: String,
    enum: ['SC', 'ST', 'OBC', 'EWS', 'General', 'Other', 'Prefer not to say'],
  },
  profession: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  aadhaarNumber: {
    type: String, // Will store encrypted string
  },
  panNumber: {
    type: String, // Will store encrypted string
  },
  dob: {
    type: Date,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Victim', victimSchema);
