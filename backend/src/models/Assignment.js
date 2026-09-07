const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  counselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'transferred', 'closed'],
    default: 'active',
    required: true,
  }
}, {
  timestamps: true
});

// Rule 1: A victim may have maximum 1 active counselor.
// We can use a partial index to enforce this at the database level.
// Wait, mongoose doesn't have a simple unique partial index syntax out of the box in the schema definition without extra syntax.
// I will create an index on victimId and status with a partial filter expression.
assignmentSchema.index(
  { victimId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'active' } 
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
