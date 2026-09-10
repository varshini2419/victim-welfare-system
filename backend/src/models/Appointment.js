const mongoose = require('mongoose');

<<<<<<< HEAD
const appointmentSchema = new mongoose.Schema(
  {
    counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    victimId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    victimName:  { type: String, default: 'Walk-in / General' },
    title:       { type: String, required: true },
    notes:       { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    durationMin: { type: Number, default: 30 },
    mode:        { type: String, enum: ['in-person', 'tele', 'voice'], default: 'in-person' },
    status:      { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
  },
  { timestamps: true }
);
=======
const appointmentSchema = new mongoose.Schema({
	victimId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true,
	},
	caseId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Case',
		required: true,
		index: true,
	},
	counselorId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	createdByRole: {
		type: String,
		enum: ['victim', 'counselor'],
		required: true,
	},
	appointmentType: {
		type: String,
		enum: ['Initial Consultation', 'Follow-up', 'Individual Counseling', 'Other'],
		required: true,
		trim: true,
	},
	reason: {
		type: String,
		required: true,
		trim: true,
		maxlength: 2000,
	},
	scheduledAt: {
		type: Date,
		required: true,
		index: true,
	},
	status: {
		type: String,
		enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED'],
		default: 'PENDING',
		index: true,
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
}, {
	timestamps: true,
});

appointmentSchema.index({ victimId: 1, status: 1, scheduledAt: 1 });
appointmentSchema.index({ counselorId: 1, status: 1, scheduledAt: 1 });
appointmentSchema.index({ caseId: 1, scheduledAt: 1 });
>>>>>>> appointment-scheduling

module.exports = mongoose.model('Appointment', appointmentSchema);
