const asyncHandler = require('express-async-handler');
const Counselor = require('../models/Counselor');
const User = require('../models/User');
const Victim = require('../models/Victim');
const Assignment = require('../models/Assignment');

// @desc    Get pending counselors
// @route   GET /api/v1/admin/counselors/pending
// @access  Private/Admin
const getPendingCounselors = asyncHandler(async (req, res) => {
  const pendingCounselors = await Counselor.find({ verificationStatus: 'pending' })
    .populate('userId', 'email createdAt');
    
  res.json({
    success: true,
    count: pendingCounselors.length,
    data: pendingCounselors
  });
});

// @desc    Verify counselor (approve or reject)
// @route   POST /api/v1/admin/counselors/:id/verify
// @access  Private/Admin
const verifyCounselor = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be approved or rejected.');
  }

  if (status === 'rejected' && !rejectionReason) {
    res.status(400);
    throw new Error('Rejection reason is required when rejecting a counselor.');
  }

  const counselor = await Counselor.findById(req.params.id);
  
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found');
  }

  const user = await User.findById(counselor.userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  counselor.verificationStatus = status;
  user.status = status === 'approved' ? 'active' : 'rejected';
  
  if (status === 'approved') {
    counselor.verifiedBy = req.user._id;
    counselor.verifiedAt = Date.now();
  } else {
    counselor.rejectionReason = rejectionReason;
  }

  await counselor.save();
  await user.save();

  res.json({
    success: true,
    data: counselor,
    message: `Counselor has been ${status}.`
  });
});

// @desc    Assign counselor to victim
// @route   POST /api/v1/admin/assignments
// @access  Private/Admin
const assignCounselor = asyncHandler(async (req, res) => {
  const { victimId, counselorId } = req.body;

  if (!victimId || !counselorId) {
    res.status(400);
    throw new Error('Both victimId and counselorId are required');
  }

  // 1. Valid victim
  const victimUser = await User.findById(victimId);
  if (!victimUser || victimUser.role !== 'victim' || victimUser.status !== 'active') {
    res.status(400);
    throw new Error('Valid, active victim user required');
  }

  // 2. Valid counselor
  const counselorUser = await User.findById(counselorId);
  const counselorProfile = await Counselor.findOne({ userId: counselorId });
  
  if (!counselorUser || counselorUser.role !== 'counselor' || counselorUser.status !== 'active') {
    res.status(400);
    throw new Error('Valid, active counselor user required');
  }

  if (!counselorProfile || counselorProfile.verificationStatus !== 'approved') {
    res.status(400);
    throw new Error('Counselor must be verified and approved');
  }

  // 3. Counselor caseload
  if (counselorProfile.currentCaseload >= counselorProfile.maxCaseload) {
    res.status(400);
    throw new Error('Counselor has reached maximum caseload');
  }

  // 4. Check existing assignment for this victim
  const existingAssignment = await Assignment.findOne({ 
    victimId: victimId, 
    status: 'active' 
  });

  // Start Transaction (requires replica set in Mongo, we'll do sequential updates with safety)
  
  if (existingAssignment) {
    if (existingAssignment.counselorId.toString() === counselorId.toString()) {
      res.status(400);
      throw new Error('Counselor is already assigned to this victim');
    }

    // Transfer/close old assignment
    existingAssignment.status = 'transferred';
    await existingAssignment.save();

    // Decrement old counselor's caseload safely
    await Counselor.findOneAndUpdate(
      { userId: existingAssignment.counselorId },
      { $inc: { currentCaseload: -1 } }
    );
  }

  // Create new assignment
  const newAssignment = await Assignment.create({
    victimId,
    counselorId,
    assignedBy: req.user._id,
    status: 'active'
  });

  // Increment new counselor's caseload safely
  await Counselor.findOneAndUpdate(
    { userId: counselorId },
    { $inc: { currentCaseload: 1 } }
  );

  res.status(201).json({
    success: true,
    data: newAssignment,
    message: 'Counselor assigned successfully'
  });
});

module.exports = {
  getPendingCounselors,
  verifyCounselor,
  assignCounselor
};
