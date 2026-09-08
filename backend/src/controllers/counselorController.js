const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Victim = require('../models/Victim');
const Counselor = require('../models/Counselor');
const Case = require('../models/Case');

// @desc    Get counselor profile for the authenticated counselor user
// @route   GET /api/v1/counselor/profile
// @access  Private/Counselor
const getMyProfile = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;

  const counselor = await Counselor.findOne({ userId: authenticatedUserId });

  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }

  res.json({
    success: true,
    data: counselor
  });
});

// @desc    Get assigned victims
// @route   GET /api/v1/counselor/victims
// @access  Private/Counselor
const getMyVictims = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const assignments = await Assignment.find({
    counselorId: authenticatedUserId,
    status: 'active'
  });

  const victimIds = assignments.map(a => a.victimId);

  const victims = await Victim.find({ userId: { $in: victimIds } })
    .select('name phone emergencyContact userId');

  const result = victims.map(victim => {
    const assignment = assignments.find(a => a.victimId.toString() === victim.userId.toString());
    return {
      victimId: victim.userId,
      name: victim.name,
      phone: victim.phone,
      emergencyContact: victim.emergencyContact,
      assignmentId: assignment._id,
      assignedAt: assignment.createdAt
    };
  });

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

// @desc    Get all case requests assigned to the authenticated counselor
// @route   GET /api/v1/counselor/assigned-cases
// @access  Private/Counselor
const getAssignedCases = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;

  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }

  const cases = await Case.find({ assignedCounselorId: counselor._id })
    .populate('victimId', 'name email phone state district registrationId')
    .populate('assignedCounselorId', 'name profession qualification district state profileImage phone experience')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: cases.length, data: cases });
});

// @desc    Get one assigned case detail, owned by the authenticated counselor only
// @route   GET /api/v1/counselor/assigned-cases/:id
// @access  Private/Counselor
const isMongoObjectIdString = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

const normalizeObjectId = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    return isMongoObjectIdString(value) ? value.toLowerCase() : null;
  }

  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') {
      return value.toHexString();
    }

    if (value._id && typeof value._id === 'object' && typeof value._id.toHexString === 'function') {
      return value._id.toHexString();
    }

    if (value._id && typeof value._id === 'string') {
      return isMongoObjectIdString(value._id) ? value._id.toLowerCase() : null;
    }

    if (value instanceof mongoose.Types.ObjectId) {
      return value.toHexString();
    }
  }

  return null;
};

const getAssignedCaseById = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;

  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }

  if (!isMongoObjectIdString(req.params.id)) {
    res.status(404);
    throw new Error('Assigned case not found');
  }

  const singleCase = await Case.findById(req.params.id)
    .populate('victimId', 'email state district registrationId')
    .populate('assignedCounselorId', 'name profession qualification district state profileImage phone experience');

  if (!singleCase) {
    res.status(404);
    throw new Error('Assigned case not found');
  }

  const assignedCounselorObjectId = normalizeObjectId(singleCase.assignedCounselorId);
  const counselorProfileObjectId = normalizeObjectId(counselor._id);
  if (!assignedCounselorObjectId || assignedCounselorObjectId !== counselorProfileObjectId) {
    res.status(403);
    throw new Error('Forbidden: this case is not assigned to your counselor profile');
  }

  const victimUserId = singleCase.victimId?._id || singleCase.victimId;
  const victim = victimUserId
    ? await Victim.findOne({ userId: victimUserId }).select('-aadhaarNumber -panNumber')
    : null;

  const caseData = singleCase.toObject();
  const userInfo = caseData.victimId && typeof caseData.victimId === 'object' ? caseData.victimId : {};
  const victimData = victim ? victim.toObject() : {};

  res.json({
    success: true,
    data: {
      case: caseData,
      victim: {
        ...victimData,
        email: userInfo.email || null,
        state: userInfo.state || null,
        district: userInfo.district || null,
        registrationId: userInfo.registrationId || null
      }
    }
  });
});

// @desc    Stream a document for a case assigned to the authenticated counselor
// @route   GET /api/v1/counselor/documents/:filename
// @access  Private/Counselor
const streamAssignedCaseDocument = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const filename = path.basename(req.params.filename || '');

  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }

  const ownedCase = await Case.findOne({
    assignedCounselorId: counselor._id,
    'documents.fileName': filename
  });

  if (!ownedCase) {
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
  normalizeObjectId,
  getMyProfile,
  getMyVictims,
  getAssignedCases,
  getAssignedCaseById,
  streamAssignedCaseDocument
};
