const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Counselor = require('../models/Counselor');

// @desc    Get assigned counselor from the case record itself
// @route   GET /api/v1/victim/counselor
// @access  Private/Victim
const getMyCounselor = asyncHandler(async (req, res) => {
  const victimCase = await Case.findOne({ victimId: req.user._id })
    .populate({
      path: 'assignedCounselorId',
      select: 'name phone qualification',
      model: 'Counselor'
    });

  if (!victimCase || !victimCase.assignedCounselorId) {
    return res.json({
      success: true,
      data: null,
      message: 'No counselor currently assigned'
    });
  }

  const counselorProfile = victimCase.assignedCounselorId;

  res.json({
    success: true,
    data: {
      assignmentId: victimCase._id,
      assignedAt: victimCase.assignedAt || victimCase.updatedAt,
      counselor: {
        name: counselorProfile.name,
        phone: counselorProfile.phone,
        qualification: counselorProfile.qualification
      }
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

const { decrypt } = require('../utils/encryption');
const Case = require('../models/Case');
const Victim = require('../models/Victim');
const fs = require('fs');
const path = require('path');

// @desc    Get current victim profile
// @route   GET /api/v1/victim/my-profile
// @access  Private/Victim
const getMyProfile = asyncHandler(async (req, res) => {
  const victim = await Victim.findOne({ userId: req.user._id }).populate('userId', 'email status state district');
  
  if (!victim) {
    res.status(404);
    throw new Error('Victim profile not found');
  }

  const maskedAadhaar = victim.aadhaarNumber ? 'XXXX-XXXX-' + decrypt(victim.aadhaarNumber).slice(-4) : null;
  const maskedPan = victim.panNumber ? 'XXXXX' + decrypt(victim.panNumber).slice(-4) + 'X' : null;

  const profileData = victim.toObject();
  profileData.aadhaarNumber = maskedAadhaar;
  profileData.panNumber = maskedPan;

  res.json({ success: true, data: profileData });
});

// @desc    Get current victim case
// @route   GET /api/v1/victim/my-case
// @access  Private/Victim
const getMyCase = asyncHandler(async (req, res) => {
  const victimCase = await Case.findOne({ victimId: req.user._id })
    .populate('assignedOfficer', 'name')
    .populate({
      path: 'assignedCounselorId',
      select: 'name phone qualification profession profileImage',
      model: 'Counselor'
    });

  if (!victimCase) {
    res.status(404);
    throw new Error('Case not found');
  }

  const safeCase = victimCase.toObject();
  if (safeCase.assignedCounselorId) {
    safeCase.assignedCounselor = {
      name: safeCase.assignedCounselorId.name,
      phone: safeCase.assignedCounselorId.phone,
      qualification: safeCase.assignedCounselorId.qualification
    };
    safeCase.counselorName = safeCase.assignedCounselorId.name;
  } else {
    safeCase.assignedCounselor = null;
  }

  delete safeCase.passwordHash;
  delete safeCase.userId;

  res.json({ success: true, data: safeCase });
});

// @desc    Securely stream a document
// @route   GET /api/v1/victim/documents/:filename
// @access  Private/Victim
const streamMyDocument = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  const victimCase = await Case.findOne({ victimId: req.user._id, 'documents.fileName': filename });
  
  if (!victimCase) {
    res.status(403);
    throw new Error('Not authorized to access this document');
  }

  const filePath = path.join(__dirname, '../../uploads/documents', filename);
  
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('Document file not found on server');
  }

  res.sendFile(filePath);
});

module.exports = {
  getMyCounselor,
  requestSupport,
  getMyProfile,
  getMyCase,
  streamMyDocument
};
