const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Victim = require('../models/Victim');
const Counselor = require('../models/Counselor');
const { generateToken } = require('../utils/jwt');

const mongoose = require('mongoose');
const Case = require('../models/Case');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const { encrypt } = require('../utils/encryption');
const { createOtp } = require('../services/otpService');
const { sendApprovalSMS, sendLoginOtpSMS } = require('../services/smsService');

const normalizeLocation = value => String(value || '').replace(/[\u00a0\s]+/g, ' ').trim();
const normalizePhoneForComparison = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 10) return digits;
  return digits;
};

const OTP_COOLDOWN_MS = parseInt(process.env.OTP_COOLDOWN_MS || String(60 * 1000));
const OTP_REQUEST_WINDOW_MS = parseInt(process.env.OTP_REQUEST_WINDOW_MS || String(15 * 60 * 1000));
const OTP_MAX_REQUESTS = parseInt(process.env.OTP_MAX_REQUESTS || String(3));
const APPROVED_CASE_STATUSES = ['open', 'in-progress', 'assigned', 'resolved'];

const clearVictimOtpFlowState = (user) => {
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpUsed = false;
  user.otpAttempts = 0;
  user.otpLockedUntil = null;
  user.otpDeliveryStatus = 'pending';
  user.otpSentAt = null;
  user.otpSendAttempts = 0;
  user.lastOtpDeliveryError = undefined;
};

const consumeVictimOtpAfterVerification = (user) => {
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpUsed = true;
  user.otpAttempts = 0;
  user.otpLockedUntil = null;
  user.otpDeliveryStatus = 'sent';
  user.otpSentAt = null;
  user.otpSendAttempts = 0;
  user.lastOtpDeliveryError = undefined;
};

const resetVictimOtpRequestWindow = (user) => {
  if (!user.otpSentAt) return;

  const sentAt = user.otpSentAt instanceof Date ? user.otpSentAt.getTime() : new Date(user.otpSentAt).getTime();
  if (Date.now() - sentAt >= OTP_REQUEST_WINDOW_MS) {
    user.otpSendAttempts = 0;
    user.otpSentAt = null;
  }
};

const enforceVictimOtpRequestRate = (user) => {
  const now = Date.now();

  if (!user.otpSentAt) {
    return;
  }

  const sentAt = user.otpSentAt instanceof Date ? user.otpSentAt.getTime() : new Date(user.otpSentAt).getTime();

  if (now - sentAt < OTP_COOLDOWN_MS) {
    throw new Error('Too many OTP resend requests. Please try again later.');
  }

  if (user.otpSendAttempts >= OTP_MAX_REQUESTS && now - sentAt < OTP_REQUEST_WINDOW_MS) {
    throw new Error('Too many OTP resend requests. Please try again later.');
  }
};

// Generate a cryptographically secure public tracking identifier
const generateTrackingId = () =>
  `ARH-REG-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

// @desc    Register a new victim
// @route   POST /api/v1/auth/register/victim
// @access  Public
const registerVictim = asyncHandler(async (req, res) => {
  let {
    email, password, state, district,
    name, phone, gender, dob, socialCategory, profession, address,
    aadhaar, pan, category, description
  } = req.body;

  state = normalizeLocation(state);
  district = normalizeLocation(district);

  // Parse JSON strings from FormData
  let emergencyContacts = [];
  let firDetails = { isFiled: false };
  let supportRequired = [];
  let immediateDanger = false;
  let consentToProcess = false;

  try {
    if (req.body.emergencyContacts) emergencyContacts = JSON.parse(req.body.emergencyContacts);
    if (req.body.firDetails) {
      const parsedFirDetails = JSON.parse(req.body.firDetails);
      firDetails = {
        isFiled: parsedFirDetails.isFiled || false,
        firNumber: parsedFirDetails.firNumber || '',
        policeStation: parsedFirDetails.policeStation || '',
        firDistrict: parsedFirDetails.firDistrict || '',
        firState: parsedFirDetails.firState || ''
      };
    }
    if (req.body.supportRequired) supportRequired = JSON.parse(req.body.supportRequired);
    if (req.body.immediateDanger === 'true' || req.body.immediateDanger === true) immediateDanger = true;
    if (req.body.consentToProcess === 'true' || req.body.consentToProcess === true) consentToProcess = true;
  } catch (e) {
    res.status(400);
    throw new Error('Invalid data format in request.');
  }

  // -------------------------------------------------------------------------
  // Handle uploaded files.
  // With multer.fields([...]) req.files is an OBJECT keyed by field name:
  //   req.files = { victimImage: [file], documents: [file, file, ...] }
  // It is NOT an array, and req.file is undefined.
  // -------------------------------------------------------------------------
  const uploadedImage = (req.files && req.files.victimImage && req.files.victimImage[0]) || null;
  const uploadedDocs = (req.files && req.files.documents) || [];

  const docs = uploadedDocs.map(file => ({
    fileName: file.filename,
    originalName: file.originalname,
    url: `/uploads/documents/${file.filename}` // Protected serving route will handle this
  }));

  let victimImagePath = null;
  if (uploadedImage && uploadedImage.filename) {
    victimImagePath = `/uploads/victim-images/${uploadedImage.filename}`;
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already exists');
  }

  let session = null;
  let useTransaction = false;

  try {
    const topologyType = mongoose.connection.client?.topology?.description?.type;
    if (topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded') {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    }
  } catch (err) {
    useTransaction = false;
    session = null;
  }

  let createdUser = null;
  let createdVictim = null;
  let createdCase = null;
  let createdAlert = null;
  let createdAudit = null;

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || crypto.randomBytes(32).toString('hex'), salt);

    const userOptions = useTransaction ? { session } : {};

    // Generate cryptographically secure public tracking identifier
    const trackingId = generateTrackingId();

    const [user] = await User.create([{
      email,
      passwordHash,
      role: 'victim',
      status: 'pending',
      state,
      district,
      profileImage: victimImagePath,
      registrationId: trackingId
    }], userOptions);
    createdUser = user;

    const [victim] = await Victim.create([{
      userId: user._id,
      name,
      phone,
      gender,
      dob,
      socialCategory,
      profession,
      address,
      pinCode: req.body.pinCode || undefined,
      district: district || undefined,
      aadhaarNumber: aadhaar ? encrypt(aadhaar) : undefined,
      panNumber: pan ? encrypt(pan) : undefined,
      emergencyContacts: emergencyContacts || []
    }], userOptions);
    createdVictim = victim;

    const [newCase] = await Case.create([{
      victimId: user._id,
      status: 'pending',
      category: category || 'Uncategorized',
      description,
      firDetails: {
        isFiled: firDetails.isFiled || false,
        firNumber: firDetails.firNumber || '',
        policeStation: firDetails.policeStation || '',
        firDistrict: firDetails.firDistrict || '',
        firState: firDetails.firState || ''
      },
      supportRequired: supportRequired || [],
      documents: docs
    }], userOptions);
    createdCase = newCase;

    if (immediateDanger === true) {
      const [alert] = await Alert.create([{
        victimId: user._id,
        severity: 'CRITICAL',
        alertType: 'EMERGENCY_REGISTRATION',
        description: 'Victim indicated immediate danger during registration.',
        status: 'NEW'
      }], userOptions);
      createdAlert = alert;
    }

    const [audit] = await AuditLog.create([{
      actorId: user._id,
      actorRole: 'victim',
      action: 'REGISTRATION_SUBMITTED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }], userOptions);
    createdAudit = audit;

    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Your application is now pending admin verification.',
      registrationId: trackingId,
      status: 'pending'
    });
  } catch (error) {
    if (useTransaction && session) {
      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
      } catch (abortErr) {
        console.error('Transaction abort error:', abortErr.message);
      } finally {
        session.endSession();
      }
    } else {
      // Compensating rollback for standalone deployments
      try {
        if (createdAudit) await AuditLog.findByIdAndDelete(createdAudit._id);
        if (createdAlert) await Alert.findByIdAndDelete(createdAlert._id);
        if (createdCase) await Case.findByIdAndDelete(createdCase._id);
        if (createdVictim) await Victim.findByIdAndDelete(createdVictim._id);
        if (createdUser) await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupErr) {
        console.error('Compensating cleanup error:', cleanupErr.message);
      }
    }
    
    // Cleanup any uploaded documents on registration error
    if (docs && docs.length > 0) {
      const fs = require('fs');
      const path = require('path');
      docs.forEach(d => {
        const filePath = path.join(__dirname, '../../uploads/documents', d.fileName);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      });
    }

    // Cleanup victim image on registration error
    if (victimImagePath) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../uploads/victim-images', path.basename(victimImagePath));
      if (fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) {}
      }
    }

    res.status(400);
    throw new Error(error.message || 'Registration failed due to server error');
  }
});


// @desc    Register a new counselor
// @route   POST /api/v1/auth/register/counselor
// @access  Public
const registerCounselor = asyncHandler(async (req, res) => {
  const { email, password, name, phone, qualifications, state, district } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    passwordHash,
    role: 'counselor',
    status: 'pending',
    state: state || 'Andhra Pradesh',
    district: district || 'All'
  });

  const counselor = await Counselor.create({
    userId: user._id,
    name,
    phone,
    qualifications,
    verificationStatus: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Counselor registered successfully. Account pending administrator verification.',
    data: {
      userId: user._id,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check account status
  if (user.status === 'pending') {
    res.status(403);
    throw new Error('Account pending administrator verification.');
  }

  if (user.status === 'rejected') {
    res.status(403);
    throw new Error('Account has been rejected by administration.');
  }

  if (user.status === 'suspended') {
    res.status(403);
    throw new Error('Account is suspended.');
  }

  if (user.status === 'inactive') {
    res.status(403);
    throw new Error('Account is inactive. Please contact your administrator.');
  }

  let profileName = '';
  if (user.role === 'victim') {
    const victim = await Victim.findOne({ userId: user._id });
    profileName = victim ? victim.name : '';
  } else if (user.role === 'counselor') {
    const counselor = await Counselor.findOne({ userId: user._id });
    profileName = counselor ? counselor.name : '';
  } else if (user.role === 'admin') {
    profileName = 'Administrator';
  }

  res.json({
    success: true,
    data: {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: profileName,
      token: generateToken(user._id, user.role, user.email)
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  
  let profile = null;
  if (user.role === 'victim') {
    profile = await Victim.findOne({ userId: user._id });
  } else if (user.role === 'counselor') {
    profile = await Counselor.findOne({ userId: user._id });
  }

  res.json({
    success: true,
    data: {
      user,
      profile
    }
  });
});

// @desc    Authenticate victim & get token
// @route   POST /api/v1/auth/login/victim
// @access  Public
const loginVictim = asyncHandler(async (req, res) => {
  const { caseId, phone, otp } = req.body;

  if (!caseId || !phone || !otp) {
    res.status(400);
    throw new Error('Case ID, phone number, and OTP are required.');
  }

  // 1. Resolve Case
  const currentCase = await Case.findOne({ caseId }).populate('victimId');
  if (!currentCase || !currentCase.victimId || !APPROVED_CASE_STATUSES.includes(currentCase.status)) {
    res.status(401);
    throw new Error('Invalid credentials.');
  }

  // 2. Validate User State
  const user = currentCase.victimId;
  if (user.status !== 'active') {
    res.status(403);
    throw new Error('Account is not active.');
  }

  // 3. Resolve Victim and verify the phone for this exact case
  const victim = await Victim.findOne({ userId: user._id });
  const normalizedSubmittedPhone = normalizePhoneForComparison(phone);
  const normalizedStoredPhone = normalizePhoneForComparison(victim?.phone);
  if (!victim || normalizedStoredPhone !== normalizedSubmittedPhone) {
    res.status(401);
    throw new Error('Invalid credentials.');
  }

  // 4. Rate Limiting Check
  if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
    res.status(403);
    const lockMinutes = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
    throw new Error(`Account locked due to too many failed attempts. Try again in ${lockMinutes} minutes.`);
  }

  // 5. Check OTP Status
  if (user.otpUsed) {
    res.status(401);
    throw new Error('This OTP has already been used. Please click "Resend OTP" or "Send OTP" to receive a new one.');
  }

  if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < Date.now()) {
    res.status(401);
    throw new Error('This OTP has expired. Please click "Resend OTP" to generate a new OTP.');
  }

  // 6. Verify OTP
  const isMatch = await bcrypt.compare(otp.toString(), user.otpHash);
  if (!isMatch) {
    user.otpAttempts += 1;
    if (user.otpAttempts >= 5) {
      user.otpLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 mins
    }
    await user.save();
    const remaining = Math.max(0, 5 - user.otpAttempts);
    res.status(401);
    throw new Error(remaining > 0 ? `Invalid OTP. ${remaining} attempt(s) remaining.` : 'Account locked due to too many failed attempts.');
  }

  // 7. Success - Consume OTP
  consumeVictimOtpAfterVerification(user);
  await user.save();

  await AuditLog.create({
    actorId: user._id,
    actorRole: 'victim',
    action: 'VICTIM_LOGIN_SUCCESS',
    targetType: 'Case',
    targetId: currentCase._id,
    caseId: currentCase.caseId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Generate Token
  res.json({
    success: true,
    data: {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: victim.name,
      token: generateToken(user._id, user.role, user.email)
    }
  });
});

// @desc    Generate and send victim login OTP
// @route   POST /api/v1/auth/login/victim/send-otp
// @route   POST /api/v1/auth/login/victim/resend-otp
// @access  Public
const resendVictimOtp = asyncHandler(async (req, res) => {
  const { caseId, phone } = req.body;
  const normalizedSubmittedPhone = normalizePhoneForComparison(phone);
  const currentCase = await Case.findOne({ caseId }).populate('victimId');
  const victim = currentCase ? await Victim.findOne({ userId: currentCase.victimId._id }) : null;

  if (!currentCase || !APPROVED_CASE_STATUSES.includes(currentCase.status) || !victim || currentCase.victimId.status !== 'active' || normalizePhoneForComparison(victim.phone) !== normalizedSubmittedPhone) {
    res.status(401);
    throw new Error('Invalid credentials. Please verify your Case ID and registered phone number.');
  }

  const user = currentCase.victimId;

  if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
    res.status(403);
    const lockMinutes = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
    throw new Error(`Account temporarily locked due to too many attempts. Try again in ${lockMinutes} minutes.`);
  }

  // Reset request counters when a request window has aged out.
  if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() >= OTP_REQUEST_WINDOW_MS) {
    user.otpSendAttempts = 0;
    user.otpSentAt = null;
  }

  // Old OTP state should not block a new valid case+phone login request.
  if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < Date.now() || user.otpUsed) {
    clearVictimOtpFlowState(user);
  }

  // Enforce cooldown between OTP sends for the same valid victim flow.
  if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < OTP_COOLDOWN_MS) {
    res.status(429);
    throw new Error('Too many OTP resend requests. Please try again later.');
  }

  // Enforce a bounded request-window security policy on stored per-user attempts.
  if (user.otpSendAttempts >= OTP_MAX_REQUESTS && user.otpSentAt && Date.now() - user.otpSentAt.getTime() < OTP_REQUEST_WINDOW_MS) {
    res.status(429);
    throw new Error('Too many OTP resend requests. Please try again later.');
  }

  // Generate OTP value + hash, but attempt SMS before writing to DB.
  const otp = await createOtp();

  // Attempt SMS delivery first — do NOT overwrite DB until known success.
  const smsResult = await sendLoginOtpSMS(victim.phone, victim.name, currentCase.caseId, otp.value);

  if (smsResult.success) {
    user.otpHash = otp.hash;
    user.otpExpiresAt = otp.expiresAt;
    user.otpUsed = false;
    user.otpAttempts = 0;
    user.otpLockedUntil = null;
    user.otpDeliveryStatus = 'sent';
    user.otpSentAt = new Date();
    user.lastOtpDeliveryError = undefined;
    user.otpSendAttempts += 1;
  } else {
    user.otpDeliveryStatus = 'failed';
    user.lastOtpDeliveryError = smsResult.error;
    user.otpSendAttempts += 1;
    user.otpSentAt = new Date();
  }

  await user.save();

  await AuditLog.create({
    actorId: user._id,
    actorRole: 'victim',
    action: smsResult.success ? 'VICTIM_LOGIN_OTP_SENT' : 'OTP_SEND_FAILED',
    targetType: 'Case',
    targetId: currentCase._id,
    caseId: currentCase.caseId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { deliveryStatus: user.otpDeliveryStatus, error: smsResult.success ? undefined : smsResult.error }
  });

  if (!smsResult.success) {
    res.status(503);
    throw new Error('OTP could not be delivered to your phone. If you have an active unexpired OTP, you may still use it, or try again in a moment.');
  }

  res.json({
    success: true,
    message: 'A 6-digit OTP has been sent to your registered phone number.'
  });
});

// @desc    Get registration status by public tracking ID
// @route   GET /api/v1/auth/registration-status/:registrationId
// @access  Public (rate-limited)
const getRegistrationStatus = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;

  if (!registrationId || typeof registrationId !== 'string' || registrationId.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Invalid Registration ID format.' });
  }

  const id = registrationId.trim();

  // Primary lookup by ARH-REG-... tracking ID
  // Fallback: ObjectId lookup for legacy test records submitted before this feature
  let user = null;
  try {
    user = await User.findOne({ registrationId: id }).select('status registrationId role');
  } catch (_) {}

  // Legacy fallback — tolerate pre-feature ObjectIds used in tests
  if (!user && mongoose.Types.ObjectId.isValid(id)) {
    try {
      user = await User.findById(id).select('status registrationId role');
    } catch (_) {}
  }

  if (!user || user.role !== 'victim') {
    return res.status(404).json({
      success: false,
      message: 'Registration not found. Please verify the Registration ID and try again.'
    });
  }

  // Find associated case — it may still be pending (no caseId yet)
  const caseRecord = await Case.findOne({ victimId: user._id })
    .select('status caseId rejectionReason updatedAt');

  // Derive safe public status
  let publicStatus;
  let extra = {};

  if (user.status === 'pending') {
    publicStatus = 'pending';
  } else if (user.status === 'active' && caseRecord && (caseRecord.status === 'open' || caseRecord.status === 'in-progress' || caseRecord.status === 'resolved')) {
    publicStatus = 'approved';
    extra = {
      caseId: caseRecord.caseId || null,
      approvedAt: caseRecord.updatedAt
    };
  } else if (user.status === 'rejected') {
    publicStatus = 'rejected';
    extra = {
      rejectionReason: (caseRecord && caseRecord.rejectionReason) || 'No reason provided.',
      reviewedAt: caseRecord ? caseRecord.updatedAt : null,
      supportContact: {
        name: process.env.SUPPORT_CONTACT_NAME || null,
        phone: process.env.SUPPORT_CONTACT_PHONE || null,
        email: process.env.SUPPORT_CONTACT_EMAIL || null
      }
    };
  } else {
    // Catch-all: still show pending if status is unexpected
    publicStatus = 'pending';
  }

  return res.status(200).json({
    success: true,
    registrationId: user.registrationId || id,
    status: publicStatus,
    ...extra
  });
});

module.exports = {
  clearVictimOtpFlowState,
  consumeVictimOtpAfterVerification,
  resetVictimOtpRequestWindow,
  enforceVictimOtpRequestRate,
  registerVictim,
  registerCounselor,
  login,
  loginVictim,
  resendVictimOtp,
  getMe,
  getRegistrationStatus
};