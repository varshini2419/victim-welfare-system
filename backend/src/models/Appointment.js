const mongoose = require('mongoose');

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

module.exports = mongoose.model('Appointment', appointmentSchema);
