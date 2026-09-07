const mongoose = require('mongoose');

const dailyUpdateSchema = new mongoose.Schema({
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  feeling: {
    type: String,
    enum: ['Very good', 'Good', 'Okay', 'Bad', 'Very bad'],
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyUpdate', dailyUpdateSchema);
