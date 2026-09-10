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
  },
  content: {
    type: String,
    trim: true,
    maxlength: 1000,
  }
}, {
  timestamps: true
});

dailyUpdateSchema.pre('validate', function validateDailyUpdate(next) {
  if (!this.feeling && !this.content) {
    this.invalidate('content', 'A daily update must include content or a check-in feeling.');
  }
  next();
});

module.exports = mongoose.model('DailyUpdate', dailyUpdateSchema);
