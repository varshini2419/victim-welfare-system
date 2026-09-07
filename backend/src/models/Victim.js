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
  },
  emergencyContact: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Victim', victimSchema);
