const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const Counselor = require('../models/Counselor');
const User = require('../models/User');
const Victim = require('../models/Victim');
const Assignment = require('../models/Assignment');
const Case = require('../models/Case');
const WelfareStaff = require('../models/WelfareStaff');

const normalizeLocation = value => String(value || '').replace(/[\u00a0\s]+/g, ' ').trim().toLowerCase();

// Helper function to get scoped user IDs
const getScopedUserIds = async (role, state, districtFilter, statusFilter) => {
  const query = { role };
  if (statusFilter) {
    query.status = statusFilter;
  }
  const users = await User.find(query).select('_id state district');
  const normalizedState = normalizeLocation(state);
  const normalizedDistrict = normalizeLocation(districtFilter);

  return users
    .filter(user => (!normalizedState || normalizedState === 'all' || normalizeLocation(user.state) === normalizedState)
      && (!normalizedDistrict || normalizedDistrict === 'all' || normalizeLocation(user.district) === normalizedDistrict))
    .map(user => user._id);
};

// @desc    Get Admin Dashboard Metrics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
const getDashboard = asyncHandler(async (req, res) => {
  const state = req.user?.state;
  
  const victimIds = await getScopedUserIds('victim', state);
  const counselorIds = await getScopedUserIds('counselor', state);
  const welfareIds = await getScopedUserIds('WELFARE_OFFICER', state);

  const Alert = require('../models/Alert');
  const AuditLog = require('../models/AuditLog');

  // Perform independent queries in parallel using Promise.all for performance
  const [
    verifiedVictims,
    pendingVictims,
    activeCounselors,
    pendingCounselors,
    activeWelfareStaff,
    activeCasesCount,
    highPriorityAlerts,
    assignments,
    latestRequests,
    recentActivity
  ] = await Promise.all([
    User.countDocuments({ _id: { $in: victimIds }, status: 'active' }),
    User.countDocuments({ _id: { $in: victimIds }, status: 'pending' }),
    Counselor.countDocuments({ userId: { $in: counselorIds }, verificationStatus: 'approved' }),
    Counselor.countDocuments({ userId: { $in: counselorIds }, verificationStatus: 'pending' }),
    WelfareStaff.countDocuments({ userId: { $in: welfareIds }, verificationStatus: 'approved' }),
    Case.countDocuments({ victimId: { $in: victimIds }, status: { $in: ['open', 'in-progress'] } }),
    Alert.countDocuments({ victimId: { $in: victimIds }, severity: { $in: ['HIGH', 'CRITICAL'] }, status: { $ne: 'RESOLVED' } }),
    Assignment.find({ status: 'active' }).distinct('victimId'),
    Case.find({ victimId: { $in: victimIds }, status: 'pending' })
      .populate('victimId', 'email name registrationId')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-description -rejectionReason'), // Exclude sensitive fields
    AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('actorId', 'email')
  ]);

  const totalVictims = victimIds.length;
  const totalCounselors = counselorIds.length;
  const totalWelfareStaff = welfareIds.length;

  const pendingAssignmentsCount = Math.max(0, verifiedVictims - assignments.length);

  res.json({
    success: true,
    data: {
      summary: {
        totalVictims,
        pendingVictims,
        totalCounselors,
        activeCounselors,
        totalWelfareStaff,
        activeWelfareStaff,
        pendingRequests: pendingVictims + pendingCounselors, // Logical aggregate for the summary card
        activeCases: activeCasesCount,
        openAlerts: highPriorityAlerts
      },
      latestRequests: latestRequests.map(r => ({
        _id: r._id,
        type: 'Registration', // Adapting based on Case context
        category: r.category,
        createdAt: r.createdAt,
        status: r.status,
        victimId: r.victimId?._id,
        registrationId: r.victimId?.registrationId,
        victimName: r.victimId?.name,
        firNumber: r.firDetails?.firNumber
      })),
      pendingActions: {
        pendingVictims,
        pendingCounselors,
        pendingAssignments: pendingAssignmentsCount,
        highPriorityAlerts
      },
      recentActivity: recentActivity.map(a => ({
        _id: a._id,
        action: a.action,
        caseId: a.caseId,
        actorEmail: a.actorId?.email || 'System',
        createdAt: a.createdAt
      })),
      state
    }
  });
});

// @desc    Get victims scoped to admin's state
// @route   GET /api/v1/admin/victims
// @access  Private/Admin
const getVictims = asyncHandler(async (req, res) => {
  const { district, status } = req.query; // Frontend filter
  const userIds = await getScopedUserIds('victim', req.user.state, district, status);

  const victims = await Victim.find({ userId: { $in: userIds } })
    .populate('userId', 'email status state district profileImage createdAt registrationId');
  const cases = await Case.find({ victimId: { $in: userIds } }).select('victimId firDetails category status createdAt').lean();
  const caseByVictim = new Map(cases.map(victimCase => [victimCase.victimId.toString(), victimCase]));

  res.json({
    success: true,
    count: victims.length,
    data: victims.map(victim => ({
      ...victim.toObject(),
      caseInfo: caseByVictim.get(victim.userId._id.toString()) || null
    }))
  });
});

// Format counselor profile for response
const formatCounselor = (counselor, user) => {
  const u = user || counselor.userId || {};
  return {
    _id: counselor._id,
    userId: u._id || counselor.userId,
    name: counselor.name,
    profession: counselor.profession || counselor.specialization || 'Counselor',
    qualification: counselor.qualification || (counselor.qualifications && counselor.qualifications.join(', ')) || 'Not Specified',
    about: counselor.about || '',
    phone: counselor.phone || '',
    email: u.email || '',
    district: counselor.district || u.district || '',
    state: counselor.state || u.state || '',
    experience: typeof counselor.experience === 'number' ? counselor.experience : 0,
    profileImage: counselor.profileImage || u.profileImage || '',
    status: u.status || (counselor.verificationStatus === 'approved' ? 'active' : 'inactive'),
    role: u.role || 'counselor',
    verificationStatus: counselor.verificationStatus,
    maxCaseload: counselor.maxCaseload || 15,
    currentCaseload: counselor.currentCaseload || 0,
    createdAt: counselor.createdAt || u.createdAt,
    updatedAt: counselor.updatedAt || u.updatedAt
  };
};

// @desc    Get all counselors with search and filter
// @route   GET /api/v1/admin/counselors
// @access  Private/Admin
const getCounselors = asyncHandler(async (req, res) => {
  const { district, status, search } = req.query;

  let counselors = await Counselor.find()
    .populate('userId', 'email status state district profileImage createdAt')
    .sort({ createdAt: -1 });

  // Filter out any orphaned counselor records without a linked user
  counselors = counselors.filter(c => c.userId);

  // Filter by status (active, inactive)
  if (status && status !== 'all') {
    counselors = counselors.filter(c => {
      const userStatus = c.userId?.status;
      if (status === 'active') return userStatus === 'active';
      if (status === 'inactive') return userStatus === 'inactive' || userStatus === 'suspended';
      return userStatus === status || c.verificationStatus === status;
    });
  }

  // Filter by district if provided
  if (district && district !== 'all') {
    counselors = counselors.filter(c => {
      const dist = (c.district || c.userId?.district || '').toLowerCase();
      return dist === district.toLowerCase();
    });
  }

  // Search across Name, Profession, District, State, Email
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    counselors = counselors.filter(c => {
      const name = (c.name || '').toLowerCase();
      const prof = (c.profession || c.specialization || '').toLowerCase();
      const dist = (c.district || c.userId?.district || '').toLowerCase();
      const st = (c.state || c.userId?.state || '').toLowerCase();
      const em = (c.userId?.email || '').toLowerCase();
      const qual = (c.qualification || (c.qualifications && c.qualifications.join(' ')) || '').toLowerCase();
      return name.includes(term) || prof.includes(term) || dist.includes(term) || st.includes(term) || em.includes(term) || qual.includes(term);
    });
  }

  res.json({
    success: true,
    count: counselors.length,
    data: counselors.map(c => formatCounselor(c, c.userId))
  });
});

// @desc    Get single counselor details
// @route   GET /api/v1/admin/counselors/:id
// @access  Private/Admin
const getCounselorById = asyncHandler(async (req, res) => {
  const counselor = await Counselor.findById(req.params.id)
    .populate('userId', 'email status state district profileImage createdAt');

  if (!counselor) {
    res.status(404);
    throw new Error('Counselor not found.');
  }

  res.json({
    success: true,
    data: formatCounselor(counselor, counselor.userId)
  });
});

// @desc    Create a new counselor
// @route   POST /api/v1/admin/counselors
// @access  Private/Admin
const createCounselor = asyncHandler(async (req, res) => {
  const {
    name,
    profession,
    qualification,
    about,
    phone,
    email,
    district,
    state,
    experience,
    status = 'active',
    password
  } = req.body;

  // 1. Validation: Profile image is mandatory
  if (!req.file) {
    res.status(400);
    throw new Error('Counselor profile image is required.');
  }

  // 2. Validation: Full Name
  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Full Name is required.');
  }

  // 3. Validation: Profession
  if (!profession || !profession.trim()) {
    res.status(400);
    throw new Error('Profession / Job Title is required.');
  }

  // 4. Validation: Qualification
  if (!qualification || !qualification.trim()) {
    res.status(400);
    throw new Error('Qualification is required.');
  }

  // 5. Validation: About
  if (!about || !about.trim()) {
    res.status(400);
    throw new Error('About / Professional Description is required.');
  }

  // 6. Validation: Phone number (Indian phone format)
  if (!phone || !phone.trim()) {
    res.status(400);
    throw new Error('Phone Number is required.');
  }
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    res.status(400);
    throw new Error('Please enter a valid 10-digit Indian phone number.');
  }

  // 7. Validation: Email address format and uniqueness
  if (!email || !email.trim()) {
    res.status(400);
    throw new Error('Email Address is required.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400);
    throw new Error('Please enter a valid email address.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(400);
    throw new Error(`A user with email "${normalizedEmail}" already exists.`);
  }

  // 8. Validation: District & State
  if (!district || !district.trim()) {
    res.status(400);
    throw new Error('District is required.');
  }
  if (!state || !state.trim()) {
    res.status(400);
    throw new Error('State is required.');
  }

  // 9. Validation: Years of Experience
  if (experience === undefined || experience === null || experience === '' || isNaN(experience) || Number(experience) < 0) {
    res.status(400);
    throw new Error('Years of Experience must be a valid positive number.');
  }

  // 10. Validation: Password
  if (!password || password.length < 4) {
    res.status(400);
    throw new Error('Password is required and must be at least 4 characters.');
  }

  // Hash password using bcrypt
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const imagePath = `/uploads/profiles/${req.file.filename}`;
  const counselorStatus = (status === 'inactive') ? 'inactive' : 'active';

  // Create User document
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: 'counselor',
    status: counselorStatus,
    state: state.trim(),
    district: district.trim(),
    profileImage: imagePath
  });

  // Create Counselor document
  const counselor = await Counselor.create({
    userId: user._id,
    name: name.trim(),
    profession: profession.trim(),
    qualification: qualification.trim(),
    qualifications: [qualification.trim()],
    about: about.trim(),
    phone: cleanPhone,
    district: district.trim(),
    state: state.trim(),
    experience: Number(experience),
    profileImage: imagePath,
    verificationStatus: counselorStatus === 'active' ? 'approved' : 'pending',
    verifiedBy: req.user._id,
    verifiedAt: counselorStatus === 'active' ? new Date() : null,
    specialization: profession.trim(),
    maxCaseload: 15,
    currentCaseload: 0
  });

  res.status(201).json({
    success: true,
    message: 'Counselor created successfully!',
    data: formatCounselor(counselor, user)
  });
});

// @desc    Update counselor details
// @route   PUT /api/v1/admin/counselors/:id
// @access  Private/Admin
const updateCounselor = asyncHandler(async (req, res) => {
  const counselor = await Counselor.findById(req.params.id);
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor not found.');
  }

  const user = await User.findById(counselor.userId);
  if (!user) {
    res.status(404);
    throw new Error('Associated user account not found.');
  }

  const {
    name,
    profession,
    qualification,
    about,
    phone,
    email,
    district,
    state,
    experience,
    status,
    password
  } = req.body;

  if (name && name.trim()) counselor.name = name.trim();
  if (profession && profession.trim()) {
    counselor.profession = profession.trim();
    counselor.specialization = profession.trim();
  }
  if (qualification && qualification.trim()) {
    counselor.qualification = qualification.trim();
    counselor.qualifications = [qualification.trim()];
  }
  if (about && about.trim()) counselor.about = about.trim();

  if (phone && phone.trim()) {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      res.status(400);
      throw new Error('Please enter a valid 10-digit Indian phone number.');
    }
    counselor.phone = cleanPhone;
  }

  if (district && district.trim()) {
    counselor.district = district.trim();
    user.district = district.trim();
  }
  if (state && state.trim()) {
    counselor.state = state.trim();
    user.state = state.trim();
  }

  if (experience !== undefined && experience !== null && experience !== '') {
    const expNum = Number(experience);
    if (isNaN(expNum) || expNum < 0) {
      res.status(400);
      throw new Error('Years of Experience must be a valid positive number.');
    }
    counselor.experience = expNum;
  }

  if (status && ['active', 'inactive'].includes(status)) {
    user.status = status;
    counselor.verificationStatus = status === 'active' ? 'approved' : 'pending';
  }

  // Handle email update and uniqueness
  if (email && email.trim() && email.trim().toLowerCase() !== user.email) {
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400);
      throw new Error('Please enter a valid email address.');
    }
    const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (emailExists) {
      res.status(400);
      throw new Error(`Email "${normalizedEmail}" is already in use by another user.`);
    }
    user.email = normalizedEmail;
  }

  // Handle optional password update (if empty, do not change)
  if (password && password.trim().length > 0) {
    if (password.trim().length < 4) {
      res.status(400);
      throw new Error('New password must be at least 4 characters.');
    }
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password.trim(), salt);
  }

  // Handle new profile image upload
  if (req.file) {
    const oldImage = counselor.profileImage;
    const newImagePath = `/uploads/profiles/${req.file.filename}`;
    counselor.profileImage = newImagePath;
    user.profileImage = newImagePath;

    if (oldImage && oldImage.startsWith('/uploads/profiles/')) {
      const oldPath = path.join(__dirname, '../../', oldImage);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to unlink old image:', e.message); }
      }
    }
  }

  await counselor.save();
  await user.save();

  res.json({
    success: true,
    message: 'Counselor updated successfully!',
    data: formatCounselor(counselor, user)
  });
});

// @desc    Delete counselor and linked user account
// @route   DELETE /api/v1/admin/counselors/:id
// @access  Private/Admin
const deleteCounselor = asyncHandler(async (req, res) => {
  const counselor = await Counselor.findById(req.params.id);
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor not found.');
  }

  // Delete image file if stored locally
  if (counselor.profileImage && counselor.profileImage.startsWith('/uploads/profiles/')) {
    const filePath = path.join(__dirname, '../../', counselor.profileImage);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to unlink image on delete:', e.message); }
    }
  }

  // Delete linked user
  if (counselor.userId) {
    await User.findByIdAndDelete(counselor.userId);
  }

  // Delete counselor document
  await Counselor.findByIdAndDelete(counselor._id);

  // Clean up any active assignments
  await Assignment.deleteMany({ counselorId: counselor.userId });

  res.json({
    success: true,
    message: 'Counselor and associated user account deleted successfully!'
  });
});

// @desc    List request records cheaply in the repository's case architecture
// @route   GET /api/v1/admin/requests
// @access  Private/Admin
const getRequests = asyncHandler(async (req, res) => {
  const userIds = await getScopedUserIds('victim', req.user.state);

  const requests = await Case.find({ victimId: { $in: userIds } })
    .populate('victimId', 'name email registrationId state district')
    .populate('assignedCounselorId', 'name profession qualification district state profileImage')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Get one request record by case id
// @route   GET /api/v1/admin/requests/:id
// @access  Private/Admin
const getRequestById = asyncHandler(async (req, res) => {
  const request = await Case.findById(req.params.id)
    .populate('victimId', 'name email registrationId state district phone')
    .populate('assignedCounselorId', 'name profession qualification district state profileImage phone experience');

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.victimId?.state && request.victimId.state !== req.user.state) {
    res.status(403);
    throw new Error('Unauthorized state access for this request');
  }

  res.json({ success: true, data: request });
});

// @desc    Return only active and verified counselors for the assignment modal
// @route   GET /api/v1/admin/counselors/active
// @access  Private/Admin
const getActiveCounselors = asyncHandler(async (req, res) => {
  const userIds = await getScopedUserIds('counselor', req.user.state);

  const counselors = await Counselor.find({
    userId: { $in: userIds },
    verificationStatus: 'approved'
  }).populate('userId', 'email status state district profileImage createdAt');

  const active = counselors.filter(c => c.userId?.status === 'active');

  res.json({
    success: true,
    count: active.length,
    data: active.map(c => formatCounselor(c, c.userId))
  });
});

// @desc    Assign an active verified counselor to the existing case record
// @route   PUT /api/v1/admin/requests/:id/assign-counselor
// @access  Private/Admin
const assignCounselorToRequest = asyncHandler(async (req, res) => {
  const { counselorId } = req.body;
  const caseId = req.params.id;

  if (!counselorId) {
    res.status(400);
    throw new Error('A counselor must be selected before assignment.');
  }

  const request = await Case.findById(caseId).populate('victimId', 'name email state district userId');
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (!request.victimId || normalizeLocation(request.victimId.state) !== normalizeLocation(req.user.state)) {
    res.status(403);
    throw new Error('Unauthorized state access for this request');
  }

  const counselorProfile = await Counselor.findById(counselorId).populate('userId');
  if (!counselorProfile) {
    res.status(404);
    throw new Error('Counselor profile not found');
  }

  if (!counselorProfile.userId || counselorProfile.userId.status !== 'active') {
    res.status(400);
    throw new Error('Only active counselors can be assigned');
  }

  if (counselorProfile.verificationStatus !== 'approved') {
    res.status(400);
    throw new Error('Only approved counselors can be assigned');
  }

  if (normalizeLocation(counselorProfile.userId.state) !== normalizeLocation(req.user.state)) {
    res.status(403);
    throw new Error('Unauthorized state access for this counselor');
  }

  request.status = 'assigned';
  request.assignedCounselorId = counselorProfile._id;
  request.assignedAt = new Date();
  request.approvedAt = new Date();
  request.approvedBy = req.user._id;
  await request.save();

  const assignment = await Assignment.findOne({ victimId: request.victimId._id, status: 'active' });
  if (assignment) {
    assignment.counselorId = counselorProfile.userId._id;
    assignment.assignedBy = req.user._id;
    await assignment.save();
  } else {
    await Assignment.create({
      victimId: request.victimId._id,
      counselorId: counselorProfile.userId._id,
      assignedBy: req.user._id,
      status: 'active'
    });
  }

  res.json({
    success: true,
    data: request,
    message: 'Request approved and counselor assigned successfully.'
  });
});

// @desc    Get pending counselors scoped to admin's state
// @route   GET /api/v1/admin/counselors/pending
// @access  Private/Admin
const getPendingCounselors = asyncHandler(async (req, res) => {
  const userIds = await getScopedUserIds('counselor', req.user.state);
  const pendingCounselors = await Counselor.find({ 
    verificationStatus: 'pending',
    userId: { $in: userIds }
  }).populate('userId', 'email state district createdAt');
    
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

  const counselor = await Counselor.findById(req.params.id).populate('userId');
  
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found');
  }

  // Security: Check State match
  if (counselor.userId.state !== req.user.state) {
    res.status(403);
    throw new Error('You are not authorized to verify counselors outside your state.');
  }

  counselor.verificationStatus = status;
  counselor.userId.status = status === 'approved' ? 'active' : 'rejected';
  
  if (status === 'approved') {
    counselor.verifiedBy = req.user._id;
    counselor.verifiedAt = Date.now();
  } else {
    counselor.rejectionReason = rejectionReason;
  }

  await counselor.save();
  await counselor.userId.save();

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

  const victimUser = await User.findById(victimId);
  if (!victimUser || victimUser.role !== 'victim' || victimUser.status !== 'active') {
    res.status(400);
    throw new Error('Valid, active victim user required');
  }

  // Security check for victim state
  if (normalizeLocation(victimUser.state) !== normalizeLocation(req.user.state)) {
    res.status(403);
    throw new Error('Unauthorized state access for victim');
  }

  const counselorUser = await User.findById(counselorId);
  const counselorProfile = await Counselor.findOne({ userId: counselorId });

  if (!counselorUser || counselorUser.role !== 'counselor' || counselorUser.status !== 'active') {
    res.status(400);
    throw new Error('Valid, active counselor user required');
  }

  // Security check for counselor state
  if (normalizeLocation(counselorUser.state) !== normalizeLocation(req.user.state)) {
    res.status(403);
    throw new Error('Unauthorized state access for counselor');
  }

  if (!counselorProfile || counselorProfile.verificationStatus !== 'approved') {
    res.status(400);
    throw new Error('Counselor must be verified and approved');
  }

  if (counselorProfile.currentCaseload >= counselorProfile.maxCaseload) {
    res.status(400);
    throw new Error('Counselor has reached maximum caseload');
  }

  const existingAssignment = await Assignment.findOne({ 
    victimId: victimId, 
    status: 'active' 
  });

  if (existingAssignment) {
    if (existingAssignment.counselorId.toString() === counselorId.toString()) {
      res.status(400);
      throw new Error('Counselor is already assigned to this victim');
    }

    existingAssignment.status = 'transferred';
    await existingAssignment.save();

    await Counselor.findOneAndUpdate(
      { userId: existingAssignment.counselorId },
      { $inc: { currentCaseload: -1 } }
    );
  }

  const newAssignment = await Assignment.create({
    victimId,
    counselorId,
    assignedBy: req.user._id,
    status: 'active'
  });

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

// @desc    Get victim details by ID including case
// @route   GET /api/v1/admin/victims/:id
// @access  Private/Admin
const getVictimDetails = asyncHandler(async (req, res) => {
  const victim = await Victim.findById(req.params.id).populate('userId', 'email status state district profileImage createdAt registrationId role otpDeliveryStatus otpSentAt otpSendAttempts');
  if (!victim) {
    res.status(404);
    throw new Error('Victim not found');
  }

  // Security check
  if (victim.userId.state !== req.user.state) {
    res.status(403);
    throw new Error('Unauthorized');
  }

  const { decrypt } = require('../utils/encryption');
  let maskedAadhaar = null;
  let maskedPan = null;

  try {
    if (victim.aadhaarNumber) {
      const plaintextAadhaar = decrypt(victim.aadhaarNumber);
      maskedAadhaar = `XXXX-XXXX-${plaintextAadhaar.slice(-4)}`;
    }
    if (victim.panNumber) {
      const plaintextPan = decrypt(victim.panNumber);
      maskedPan = `${plaintextPan.slice(0, 5)}XXXX${plaintextPan.slice(-1)}`;
    }
  } catch (e) {
    console.error('Error decrypting identity information for admin view', e);
  }

  // Prevent sending plaintext over network
  const safeVictim = victim.toObject();
  safeVictim.aadhaarNumber = maskedAadhaar;
  safeVictim.panNumber = maskedPan;

  const userCase = await Case.findOne({ victimId: victim.userId._id }).populate('counselorId', 'email');

  res.json({
    success: true,
    data: {
      victim: safeVictim,
      caseInfo: userCase
    }
  });
});

module.exports = {
  getDashboard,
  getVictims,
  getVictimDetails,
  getCounselors,
  getCounselorById,
  createCounselor,
  updateCounselor,
  deleteCounselor,
  getPendingCounselors,
  verifyCounselor,
  assignCounselor,
  getRequests,
  getRequestById,
  getActiveCounselors,
  assignCounselorToRequest
};
