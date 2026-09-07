const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Counselor = require('../models/Counselor');

// @desc    Get assigned counselor
// @route   GET /api/v1/victim/counselor
// @access  Private/Victim
const getMyCounselor = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ 
    victimId: req.user._id, 
    status: 'active' 
  });

  if (!assignment) {
    return res.json({
      success: true,
      data: null,
      message: 'No counselor currently assigned'
    });
  }

  const counselorProfile = await Counselor.findOne({ userId: assignment.counselorId })
    .select('name phone qualifications');

  res.json({
    success: true,
    data: {
      assignmentId: assignment._id,
      assignedAt: assignment.createdAt,
      counselor: counselorProfile
    }
  });
});

const Notification = require('../models/Notification');

// @desc    Request counselor support
// @route   POST /api/v1/victim/request-support
// @access  Private/Victim
const requestSupport = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ 
    victimId: req.user._id, 
    status: 'active' 
  });

  if (!assignment) {
    res.status(400);
    throw new Error('No active counselor assigned to request support from.');
  }

  // Create notification for the counselor
  await Notification.create({
    recipientId: assignment.counselorId,
    senderId: req.user._id,
    type: 'support_request',
    message: 'Your assigned victim has requested support contact.'
  });

  res.status(200).json({
    success: true,
    message: 'Support request sent to your counselor successfully.'
  });
});

module.exports = {
  getMyCounselor,
  requestSupport
};
