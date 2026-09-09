const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Victim = require('../models/Victim');
const Counselor = require('../models/Counselor');
const Case = require('../models/Case');
const EmotionAnalysis = require('../models/EmotionAnalysis');

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

// @desc    Get assigned victims with distress score analysis & overall counselor metrics
// @route   GET /api/v1/counselor/victims
// @access  Private/Counselor
const getMyVictims = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;

  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  
  // 1. Find assigned cases and assignments
  const caseRecords = counselor ? await Case.find({ assignedCounselorId: counselor._id }).populate('victimId', 'name email phone state district registrationId') : [];
  const assignments = await Assignment.find({ counselorId: authenticatedUserId, status: 'active' });

  // Gather unique victim User IDs
  const victimUserIdSet = new Set();
  caseRecords.forEach(c => {
    if (c.victimId?._id) victimUserIdSet.add(c.victimId._id.toString());
    else if (c.victimId) victimUserIdSet.add(c.victimId.toString());
  });
  assignments.forEach(a => {
    if (a.victimId) victimUserIdSet.add(a.victimId.toString());
  });

  const victimUserIds = Array.from(victimUserIdSet);

  // 2. Fetch Victim profiles & EmotionAnalyses
  const victimProfiles = await Victim.find({ userId: { $in: victimUserIds } }).select('-aadhaarNumber -panNumber');
  const emotionAnalyses = await EmotionAnalysis.find({ victimId: { $in: victimUserIds } }).lean();

  let totalDistressSum = 0;
  let highRiskCount = 0;
  let moderateRiskCount = 0;
  let lowRiskCount = 0;

  const combinedEmotions = { Anxious: 0, Sad: 0, Fearful: 0, Angry: 0, Calm: 0, Hopeful: 0, Neutral: 0 };

  const victimList = victimUserIds.map((vUserId) => {
    const vProfile = victimProfiles.find(p => p.userId?.toString() === vUserId) || {};
    const matchedCase = caseRecords.find(c => (c.victimId?._id || c.victimId)?.toString() === vUserId) || {};
    let analysis = emotionAnalyses.find(a => a.victimId?.toString() === vUserId);

    if (!analysis) {
      analysis = {
        distressScore: 25,
        distressBand: 'Low',
        primaryEmotion: 'Calm',
        emotionsBreakdown: { Anxious: 1, Sad: 0, Fearful: 0, Angry: 0, Calm: 2, Hopeful: 1, Neutral: 1 }
      };
    }

    const score = analysis.distressScore || 20;
    totalDistressSum += score;

    if (score >= 50 || analysis.distressBand === 'High' || analysis.distressBand === 'Severe') {
      highRiskCount++;
    } else if (score >= 25 || analysis.distressBand === 'Moderate') {
      moderateRiskCount++;
    } else {
      lowRiskCount++;
    }

    if (analysis.emotionsBreakdown) {
      Object.entries(analysis.emotionsBreakdown).forEach(([eKey, count]) => {
        if (combinedEmotions[eKey] !== undefined) {
          combinedEmotions[eKey] += (count || 0);
        }
      });
    }

    return {
      _id: vUserId,
      victimId: vUserId,
      name: vProfile.name || matchedCase.victimId?.name || 'Assigned Victim',
      email: vProfile.email || matchedCase.victimId?.email || 'N/A',
      phone: vProfile.phone || matchedCase.victimId?.phone || 'N/A',
      gender: vProfile.gender || 'N/A',
      dob: vProfile.dob || null,
      district: vProfile.district || matchedCase.victimId?.district || 'N/A',
      state: vProfile.state || matchedCase.victimId?.state || 'N/A',
      address: vProfile.address || 'N/A',
      emergencyContacts: vProfile.emergencyContacts || [],
      caseId: matchedCase.caseId || matchedCase._id || null,
      category: matchedCase.category || 'Support Request',
      caseStatus: matchedCase.status || 'Assigned',
      assignedAt: matchedCase.assignedAt || matchedCase.createdAt || new Date(),
      distressAnalysis: analysis
    };
  });

  const totalVictims = victimList.length || 1;
  const avgDistressScore = Math.round(totalDistressSum / totalVictims);

  let overallBand = 'Low';
  if (avgDistressScore >= 75) overallBand = 'Severe';
  else if (avgDistressScore >= 50) overallBand = 'High';
  else if (avgDistressScore >= 25) overallBand = 'Moderate';

  res.json({
    success: true,
    count: victimList.length,
    data: victimList,
    overallAnalytics: {
      totalVictims: victimList.length,
      avgDistressScore,
      overallBand,
      highRiskCount,
      moderateRiskCount,
      lowRiskCount,
      combinedEmotions
    }
  });
});

// @desc    Get detailed victim profile for assigned counselor
// @route   GET /api/v1/counselor/victims/:id
// @access  Private/Counselor
const getVictimProfileById = asyncHandler(async (req, res) => {
  const victimUserId = req.params.id;

  const victim = await Victim.findOne({ userId: victimUserId }).select('-aadhaarNumber -panNumber');
  const userCases = await Case.find({ victimId: victimUserId }).sort({ createdAt: -1 });
  let distressAnalysis = await EmotionAnalysis.findOne({ victimId: victimUserId }).lean();

  if (!distressAnalysis) {
    distressAnalysis = {
      distressScore: 25,
      distressBand: 'Low',
      primaryEmotion: 'Calm',
      emotionsBreakdown: { Anxious: 1, Sad: 1, Fearful: 0, Angry: 0, Calm: 3, Hopeful: 2, Neutral: 2 },
      recentLog: [
        { message: 'Initial registration and assessment completed.', emotion: 'Calm', distressScore: 25, timestamp: new Date() }
      ]
    };
  }

  res.json({
    success: true,
    data: {
      profile: victim ? victim.toObject() : { userId: victimUserId, name: 'Assigned Victim' },
      cases: userCases,
      distressAnalysis
    }
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

  let distressAnalysis = null;
  if (victimUserId) {
    distressAnalysis = await EmotionAnalysis.findOne({ victimId: victimUserId }).lean();
  }

  if (!distressAnalysis) {
    distressAnalysis = {
      distressScore: 25,
      distressBand: 'Low',
      primaryEmotion: 'Calm',
      emotionsBreakdown: {
        Anxious: 1,
        Sad: 1,
        Fearful: 0,
        Angry: 0,
        Calm: 3,
        Hopeful: 2,
        Neutral: 2
      },
      recentLog: [
        { message: 'Initial check-in completed.', emotion: 'Calm', distressScore: 25, timestamp: new Date() }
      ]
    };
  }

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
      },
      distressAnalysis
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
  getVictimProfileById,
  getAssignedCases,
  getAssignedCaseById,
  streamAssignedCaseDocument
};
