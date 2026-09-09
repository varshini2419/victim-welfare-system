const asyncHandler = require('express-async-handler');
const Case = require('../models/Case');
const User = require('../models/User');
const Victim = require('../models/Victim');
const AuditLog = require('../models/AuditLog');
const Counter = require('../models/Counter');
const { createOtp } = require('../services/otpService');
const { sendApprovalSMS } = require('../services/smsService');

const APPROVED_CASE_STATUSES = ['open', 'in-progress', 'assigned', 'resolved'];
const isAuthorizedState = (victimUser, adminUser) => victimUser?.state === adminUser.state;

// @desc    Upload required case documents before approval
// @route   POST /api/v1/admin/cases/:id/documents
// @access  Private/Admin
const uploadCaseDocuments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('At least one case document is required.');
  }

  const currentCase = await Case.findById(req.params.id).populate('victimId');
  if (!currentCase) {
    res.status(404);
    throw new Error('Case not found');
  }

  if (!isAuthorizedState(currentCase.victimId, req.user)) {
    res.status(403);
    throw new Error('Unauthorized state access for this case');
  }

  if (currentCase.status !== 'pending') {
    res.status(400);
    throw new Error('Documents can only be uploaded for pending cases.');
  }

  const documents = req.files.map(file => ({
    fileName: file.filename,
    originalName: file.originalname,
    url: `/uploads/documents/${file.filename}`,
    uploadedBy: req.user._id
  }));

  currentCase.documents.push(...documents);
  await currentCase.save();

  await AuditLog.create({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'DOCUMENT_UPLOADED',
    targetType: 'Case',
    targetId: currentCase._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { fileNames: documents.map(document => document.fileName) }
  });

  res.status(201).json({
    success: true,
    message: 'Case documents uploaded successfully.',
    data: { documents }
  });
});

// @desc    Approve Case
// @route   POST /api/v1/admin/cases/:id/approve
// @access  Private/Admin
const approveCase = asyncHandler(async (req, res) => {
  const caseId = req.params.id;
  const mongoose = require('mongoose');
  
  const currentCase = await Case.findById(caseId).populate('victimId');
  if (!currentCase) {
    res.status(404);
    throw new Error('Case not found');
  }

  if (currentCase.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending cases can be approved');
  }

  if (currentCase.caseId) {
    res.status(409);
    throw new Error('This case has already been approved.');
  }

  const victim = await Victim.findOne({ userId: currentCase.victimId._id }).select('phone name');
  if (!victim?.phone) {
    res.status(400);
    throw new Error('A valid victim phone number is required before approval.');
  }

  const adminUploadedDocument = currentCase.documents.some(document => document.uploadedBy);
  if (!adminUploadedDocument) {
    res.status(400);
    throw new Error('Upload at least one victim or case-related document before final approval.');
  }

  // State authorization
  if (!isAuthorizedState(currentCase.victimId, req.user)) {
    res.status(403);
    throw new Error('Unauthorized state access for this case');
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
  } catch (error) {
    session = null;
  }

  let generatedCaseId = null;
  let otp = null;

  try {
    // 1. Atomic Sequence Generation for Case ID
    const year = new Date().getFullYear();
    const counterId = `caseId_${year}`;
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true, ...(useTransaction ? { session } : {}) }
    );
    generatedCaseId = `ARH-${year}-${String(counter.sequence_value).padStart(3, '0')}`;

    currentCase.status = 'open';
    currentCase.caseId = generatedCaseId;
    otp = await createOtp();
    await currentCase.save(useTransaction ? { session } : undefined);

    const userQuery = User.findById(currentCase.victimId._id);
    if (useTransaction) userQuery.session(session);
    const user = await userQuery;
    user.status = 'active';
    user.otpDeliveryStatus = 'pending';
    user.lastOtpDeliveryError = undefined;
    await user.save(useTransaction ? { session } : undefined);

    // Audit Log
    await AuditLog.create([{
      actorId: req.user._id,
      actorRole: 'admin',
      action: 'CASE_APPROVED',
      targetType: 'Case',
      targetId: currentCase._id,
      caseId: generatedCaseId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }], useTransaction ? { session } : undefined);

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    const smsResult = await sendApprovalSMS(victim.phone, victim.name, generatedCaseId, otp.value);
    user.otpDeliveryStatus = smsResult.success ? 'sent' : 'failed';
    user.lastOtpDeliveryError = smsResult.success ? undefined : smsResult.error;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: 'admin',
      action: smsResult.success ? 'OTP_SENT' : 'OTP_SEND_FAILED',
      targetType: 'Case',
      targetId: currentCase._id,
      caseId: generatedCaseId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { deliveryStatus: user.otpDeliveryStatus, error: smsResult.success ? undefined : smsResult.error }
    });

    res.json({
      success: true,
      message: 'Victim registration approved successfully.',
      data: {
        caseId: currentCase._id,
        officialCaseId: generatedCaseId,
        status: currentCase.status,
        userStatus: 'active',
        otpDeliveryStatus: user.otpDeliveryStatus
      }
    });
  } catch (error) {
    if (useTransaction && session) {
      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
      } catch (abortErr) {
        console.error('Abort transaction error in approveCase:', abortErr.message);
      } finally {
        session.endSession();
      }
    }
    
    res.status(400);
    throw new Error(error.message || 'Case approval failed');
  }
});

// @desc    Retry victim OTP delivery for an approved case
// @route   POST /api/v1/admin/cases/:id/resend-otp
// @access  Private/Admin
const resendCaseOtp = asyncHandler(async (req, res) => {
  const currentCase = await Case.findById(req.params.id).populate('victimId');
  if (!currentCase || !currentCase.caseId || !APPROVED_CASE_STATUSES.includes(currentCase.status)) {
    res.status(400);
    throw new Error('Only approved cases can resend an OTP.');
  }

  if (!isAuthorizedState(currentCase.victimId, req.user)) {
    res.status(403);
    throw new Error('Unauthorized state access for this case');
  }

  const victim = await Victim.findOne({ userId: currentCase.victimId._id }).select('phone name');
  if (!victim?.phone) {
    res.status(400);
    throw new Error('A valid victim phone number is required before sending an OTP.');
  }

  // Generate OTP value + hash, but attempt SMS BEFORE writing to DB.
  // This prevents the previous working OTP from being invalidated when SMS fails.
  const otp = await createOtp();
  const user = currentCase.victimId;

  // Attempt SMS delivery first — do NOT overwrite DB until we know it succeeded
  const smsResult = await sendApprovalSMS(victim.phone, victim.name, currentCase.caseId, otp.value);

  if (smsResult.success) {
    // Approval codes are delivery-only and cannot authenticate victim login.
    user.otpDeliveryStatus = 'sent';
    user.otpSentAt = null;
    user.lastOtpDeliveryError = undefined;
    user.otpSendAttempts = 0;
  } else {
    user.otpDeliveryStatus = 'failed';
    user.lastOtpDeliveryError = smsResult.error;
    user.otpSentAt = null;
    user.otpSendAttempts = 0;
  }
  await user.save();

  await AuditLog.create({
    actorId: req.user._id,
    actorRole: 'admin',
    action: smsResult.success ? 'OTP_RESENT' : 'OTP_SEND_FAILED',
    targetType: 'Case',
    targetId: currentCase._id,
    caseId: currentCase.caseId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { deliveryStatus: user.otpDeliveryStatus, error: smsResult.success ? undefined : smsResult.error }
  });

  res.json({
    success: true,
    message: smsResult.success
      ? 'A new OTP has been sent to the registered mobile number.'
      : 'OTP delivery failed. The previous OTP (if valid) remains active.',
    data: { otpDeliveryStatus: user.otpDeliveryStatus }
  });
});

// @desc    Securely stream a document
// @route   GET /api/v1/admin/documents/:filename
// @access  Private/Admin
const streamAdminDocument = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  const fs = require('fs');
  const path = require('path');
  
  // Verify document exists in any case
  const docCase = await Case.findOne({ 'documents.fileName': filename }).populate('victimId', 'state');
  
  if (!docCase) {
    res.status(404);
    throw new Error('Document not found in any case records');
  }

  if (!isAuthorizedState(docCase.victimId, req.user)) {
    res.status(403);
    throw new Error('Unauthorized document access');
  }

  const filePath = path.join(__dirname, '../../uploads/documents', filename);
  
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('Document file not found on server');
  }

  res.sendFile(filePath);
});

// @desc    Reject Case
// @route   POST /api/v1/admin/cases/:id/reject
// @access  Private/Admin
const rejectCase = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('Rejection reason required');
  }

  const currentCase = await Case.findById(req.params.id).populate('victimId');
  if (!currentCase) {
    res.status(404);
    throw new Error('Case not found');
  }

  if (currentCase.victimId.state !== req.user.state) {
    res.status(403);
    throw new Error('Unauthorized');
  }

  currentCase.status = 'rejected';
  currentCase.rejectionReason = reason;
  await currentCase.save();

  const user = await User.findById(currentCase.victimId._id);
  user.status = 'rejected';
  await user.save();

  await AuditLog.create({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'CASE_REJECTED',
    targetType: 'Case',
    targetId: currentCase._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { reason }
  });

  res.json({ success: true, message: 'Case rejected' });
});

module.exports = {
  uploadCaseDocuments,
  approveCase,
  resendCaseOtp,
  rejectCase,
  streamAdminDocument
};
