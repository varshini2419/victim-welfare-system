const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    victimId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    victimName: { type: String, default: 'Walk-in / General' },
    title: { type: String, trim: true },
    notes: { type: String, default: '', trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMin: { type: Number, default: 30 },
    mode: { type: String, enum: ['in-person', 'tele', 'voice'], default: 'in-person' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdByRole: {
      type: String,
      enum: ['victim', 'counselor'],
      default: null,
    },
    appointmentType: {
      type: String,
      enum: ['Initial Consultation', 'Follow-up', 'Individual Counseling', 'Other'],
      trim: true,
      default: 'Initial Consultation',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    consultationNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    approvedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

appointmentSchema.index({ victimId: 1, status: 1, scheduledAt: 1 });
appointmentSchema.index({ counselorId: 1, status: 1, scheduledAt: 1 });
appointmentSchema.index({ caseId: 1, scheduledAt: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
