const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const WelfareStaff = require('../models/WelfareStaff');
const Victim = require('../models/Victim');
const Case = require('../models/Case');
const EmotionAnalysis = require('../models/EmotionAnalysis');

const OFFICER_ROLE = 'WELFARE_OFFICER';
const SPECIALIZATIONS = [
  'Welfare & Social Support',
  'Rehabilitation',
  'Protection & Relocation',
  'Medical Support',
  'Financial / Compensation',
  'Legal Aid Coordination'
];
const phonePattern = /^(?:\+91|91)?[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanPhone = value => String(value || '').trim().replace(/[\s-]/g, '');
const normalizeList = value => Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
const inAdminState = (state, adminState) => !adminState || adminState === 'All' || state === adminState;

const handleDuplicateKey = error => {
  if (error?.code !== 11000) return false;
  const field = Object.keys(error.keyPattern || {})[0] || 'field';
  const labels = { officerId: 'Officer ID', email: 'Email', phone: 'Mobile number' };
  const duplicateError = new Error(`${labels[field] || field} already exists.`);
  duplicateError.statusCode = 400;
  throw duplicateError;
};

const formatOfficer = (staff, user, assignedVictims = 0) => ({
  _id: staff._id,
  userId: user?._id || staff.userId,
  name: staff.name,
  officerId: staff.officerId,
  phone: staff.phone,
  email: user?.email || '',
  state: staff.state || user?.state || '',
  district: staff.district || user?.district || '',
  officerType: staff.officerType,
  specializations: staff.specializations,
  status: user?.status || 'inactive',
  assignedVictims,
  createdAt: staff.createdAt,
  updatedAt: staff.updatedAt
});

const getAssignedCounts = async staffIds => {
  const counts = await Case.aggregate([
    { $match: { assignedOfficer: { $in: staffIds.map(id => id) } } },
    { $group: { _id: '$assignedOfficer', count: { $sum: 1 } } }
  ]);
  return new Map(counts.map(item => [item._id.toString(), item.count]));
};

const validateOfficerInput = ({ name, officerId, phone, email, state, district, specializations }) => {
  if (!name?.trim()) throw Object.assign(new Error('Full Name is required.'), { statusCode: 400 });
  if (!officerId?.trim()) throw Object.assign(new Error('Officer ID is required.'), { statusCode: 400 });
  const normalizedPhone = cleanPhone(phone);
  if (!phone || !phonePattern.test(normalizedPhone)) {
    throw Object.assign(new Error('Please enter a valid 10-digit Indian mobile number.'), { statusCode: 400 });
  }
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!email || !emailPattern.test(normalizedEmail)) {
    throw Object.assign(new Error('Please enter a valid email address.'), { statusCode: 400 });
  }
  if (!state?.trim()) throw Object.assign(new Error('State is required.'), { statusCode: 400 });
  if (!district?.trim()) throw Object.assign(new Error('District is required.'), { statusCode: 400 });
  const selectedSpecializations = normalizeList(specializations);
  if (!selectedSpecializations.length || selectedSpecializations.some(item => !SPECIALIZATIONS.includes(item))) {
    throw Object.assign(new Error('Select at least one valid specialization.'), { statusCode: 400 });
  }
  return { normalizedPhone, normalizedEmail, selectedSpecializations };
};

const getWelfareOfficers = asyncHandler(async (req, res) => {
  const { search, state, district, specialization, status } = req.query;
  const users = await User.find({ role: OFFICER_ROLE }).select('-passwordHash').lean();
  const userById = new Map(users.map(user => [user._id.toString(), user]));
  const query = {};
  if (state && state !== 'all') query.state = state;
  if (district && district !== 'all') query.district = district;
  if (specialization && specialization !== 'all') query.specializations = specialization;
  let officers = await WelfareStaff.find(query).sort({ createdAt: -1 }).lean();
  officers = officers.filter(staff => {
    const user = userById.get(staff.userId.toString());
    if (!user || !inAdminState(staff.state || user.state, req.user.state)) return false;
    if (status && status !== 'all' && user.status !== status) return false;
    if (!search?.trim()) return true;
    const term = search.trim().toLowerCase();
    return [staff.name, staff.officerId, user.email].some(value => String(value || '').toLowerCase().includes(term));
  });

  const counts = await getAssignedCounts(officers.map(staff => staff.userId));
  res.json({
    success: true,
    count: officers.length,
    data: officers.map(staff => formatOfficer(staff, userById.get(staff.userId.toString()), counts.get(staff.userId.toString()) || 0))
  });
});

const getWelfareOfficer = asyncHandler(async (req, res) => {
  const staff = await WelfareStaff.findById(req.params.id).lean();
  if (!staff) { res.status(404); throw new Error('Welfare officer not found.'); }
  const user = await User.findById(staff.userId).select('-passwordHash').lean();
  if (!user || user.role !== OFFICER_ROLE || !inAdminState(staff.state || user.state, req.user.state)) {
    res.status(404); throw new Error('Welfare officer not found.');
  }
  const cases = await Case.find({ assignedOfficer: user._id })
    .populate('victimId', 'name email registrationId state district')
    .select('caseId victimId status category supportRequired assignedAt')
    .lean();
  const analyses = await EmotionAnalysis.find({ victimId: { $in: cases.map(item => item.victimId?._id).filter(Boolean) } })
    .sort({ createdAt: -1 }).select('victimId distressBand distressScore').lean();
  const analysisByVictim = new Map();
  analyses.forEach(analysis => {
    if (!analysisByVictim.has(analysis.victimId.toString())) analysisByVictim.set(analysis.victimId.toString(), analysis);
  });
  const assignedVictims = cases.map(item => ({
    ...item,
    assignmentStatus: 'assigned',
    riskLevel: analysisByVictim.get(item.victimId?._id?.toString())?.distressBand || 'Not assessed',
    distressScore: analysisByVictim.get(item.victimId?._id?.toString())?.distressScore ?? null
  }));
  res.json({ success: true, data: { ...formatOfficer(staff, user, cases.length), assignedVictims } });
});

const createWelfareOfficer = asyncHandler(async (req, res) => {
  const { name, officerId, phone, email, state, district, specializations, status = 'active', password } = req.body;
  const { normalizedPhone, normalizedEmail, selectedSpecializations } = validateOfficerInput({ name, officerId, phone, email, state, district, specializations });
  const normalizedOfficerId = officerId.trim().toUpperCase();
  if (!['active', 'inactive'].includes(status)) { res.status(400); throw new Error('Status must be active or inactive.'); }
  if (!password || password.length < 4) { res.status(400); throw new Error('Password is required and must be at least 4 characters.'); }
  if (await User.exists({ email: normalizedEmail })) { res.status(400); throw new Error('Email already exists.'); }
  if (await WelfareStaff.exists({ $or: [{ officerId: normalizedOfficerId }, { phone: normalizedPhone }] })) {
    res.status(400); throw new Error('Officer ID or mobile number already exists.');
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      role: OFFICER_ROLE,
      status,
      state: state.trim(),
      district: district.trim()
    });
    const staff = await WelfareStaff.create({
      userId: user._id,
      name: name.trim(),
      officerId: normalizedOfficerId,
      phone: normalizedPhone,
      state: state.trim(),
      district: district.trim(),
      officerType: OFFICER_ROLE,
      specializations: selectedSpecializations,
      category: 'Other',
      designation: 'Welfare / Rehabilitation Officer',
      department: 'Welfare and Rehabilitation',
      verificationStatus: status === 'active' ? 'approved' : 'pending',
      verifiedBy: req.user._id
    });
    res.status(201).json({ success: true, message: 'Welfare officer created successfully.', data: formatOfficer(staff, user) });
  } catch (error) {
    handleDuplicateKey(error);
    throw error;
  }
});

const updateWelfareOfficer = asyncHandler(async (req, res) => {
  const staff = await WelfareStaff.findById(req.params.id);
  if (!staff) { res.status(404); throw new Error('Welfare officer not found.'); }
  const user = await User.findById(staff.userId);
  if (!user || user.role !== OFFICER_ROLE) { res.status(404); throw new Error('Welfare officer account not found.'); }
  if (!inAdminState(staff.state || user.state, req.user.state)) { res.status(403); throw new Error('Unauthorized.'); }

  const { name, officerId, phone, email, state, district, specializations, status } = req.body;
  const next = {
    name: name ?? staff.name,
    officerId: officerId ?? staff.officerId,
    phone: phone ?? staff.phone,
    email: email ?? user.email,
    state: state ?? staff.state,
    district: district ?? staff.district,
    specializations: specializations ?? staff.specializations
  };
  const { normalizedPhone, normalizedEmail, selectedSpecializations } = validateOfficerInput(next);
  const normalizedOfficerId = next.officerId.trim().toUpperCase();
  if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) { res.status(400); throw new Error('Email already exists.'); }
  if (await WelfareStaff.exists({ $or: [{ officerId: normalizedOfficerId }, { phone: normalizedPhone }], _id: { $ne: staff._id } })) {
    res.status(400); throw new Error('Officer ID or mobile number already exists.');
  }

  staff.name = next.name.trim();
  staff.officerId = normalizedOfficerId;
  staff.phone = normalizedPhone;
  staff.state = next.state.trim();
  staff.district = next.district.trim();
  staff.specializations = selectedSpecializations;
  staff.category = 'Other';
  user.email = normalizedEmail;
  user.state = next.state.trim();
  user.district = next.district.trim();
  if (status !== undefined) {
    if (!['active', 'inactive'].includes(status)) { res.status(400); throw new Error('Status must be active or inactive.'); }
    user.status = status;
    staff.verificationStatus = status === 'active' ? 'approved' : 'pending';
  }

  try {
    await staff.save();
    await user.save();
  } catch (error) {
    handleDuplicateKey(error);
    throw error;
  }
  res.json({ success: true, message: 'Welfare officer updated successfully.', data: formatOfficer(staff, user) });
});

const setWelfareOfficerStatus = asyncHandler(async (req, res) => {
  const staff = await WelfareStaff.findById(req.params.id);
  if (!staff) { res.status(404); throw new Error('Welfare officer not found.'); }
  const user = await User.findById(staff.userId);
  if (!user || user.role !== OFFICER_ROLE) { res.status(404); throw new Error('Welfare officer account not found.'); }
  if (!inAdminState(staff.state || user.state, req.user.state)) { res.status(403); throw new Error('Unauthorized.'); }
  const status = req.body.status;
  if (!['active', 'inactive'].includes(status)) { res.status(400); throw new Error('Status must be active or inactive.'); }
  user.status = status;
  staff.verificationStatus = status === 'active' ? 'approved' : 'pending';
  await Promise.all([user.save(), staff.save()]);
  res.json({ success: true, message: `Welfare officer ${status === 'active' ? 'activated' : 'deactivated'}.`, data: formatOfficer(staff, user) });
});

const getWelfareStats = asyncHandler(async (req, res) => {
  const users = await User.find({ role: OFFICER_ROLE }).select('_id status state district').lean();
  const scoped = users.filter(user => inAdminState(user.state, req.user.state));
  const activeIds = scoped.filter(user => user.status === 'active').map(user => user._id);
  const assigned = await Case.countDocuments({ assignedOfficer: { $in: activeIds } });
  res.json({ success: true, data: {
    totalOfficers: scoped.length,
    activeOfficers: activeIds.length,
    assignedVictims: assigned,
    availableOfficers: activeIds.length - new Set(await Case.find({ assignedOfficer: { $in: activeIds } }).distinct('assignedOfficer')).size
  } });
});

const getEligibleWelfareVictims = asyncHandler(async (req, res) => {
  const staff = await WelfareStaff.findById(req.params.id).lean();
  if (!staff) { res.status(404); throw new Error('Welfare officer not found.'); }
  const user = await User.findById(staff.userId).lean();
  if (!user || user.status !== 'active') { res.status(400); throw new Error('Inactive welfare officers cannot receive assignments.'); }
  if (!inAdminState(staff.state || user.state, req.user.state)) { res.status(403); throw new Error('Unauthorized.'); }
  const assignedCaseVictims = await Case.find({ assignedOfficer: { $exists: true, $ne: null } }).distinct('victimId');
  const victims = await Case.find({
    victimId: { $nin: assignedCaseVictims },
    status: { $nin: ['closed', 'rejected'] }
  }).populate('victimId', 'name email registrationId state district').select('caseId victimId status category supportRequired').lean();
  res.json({ success: true, data: victims.filter(item => item.victimId && inAdminState(item.victimId.state, req.user.state)) });
});

const assignVictimToWelfareOfficer = asyncHandler(async (req, res) => {
  const staff = await WelfareStaff.findById(req.params.id).lean();
  if (!staff) { res.status(404); throw new Error('Welfare officer not found.'); }
  const officer = await User.findById(staff.userId).lean();
  if (!officer || officer.role !== OFFICER_ROLE || officer.status !== 'active') { res.status(400); throw new Error('Inactive welfare officers cannot receive assignments.'); }
  if (!inAdminState(staff.state || officer.state, req.user.state)) { res.status(403); throw new Error('Unauthorized.'); }
  const victim = await User.findOne({ _id: req.body.victimId, role: 'victim' }).lean();
  if (!victim || !inAdminState(victim.state, req.user.state)) { res.status(404); throw new Error('Eligible victim not found.'); }
  const existing = await Case.findOne({ victimId: victim._id, assignedOfficer: { $exists: true, $ne: null } });
  if (existing) { res.status(400); throw new Error('This victim already has a welfare officer assignment.'); }
  const victimCase = await Case.findOne({ victimId: victim._id, status: { $nin: ['closed', 'rejected'] } }).sort({ createdAt: -1 });
  if (!victimCase) { res.status(404); throw new Error('No eligible case found for this victim.'); }
  victimCase.assignedOfficer = officer._id;
  victimCase.assignedAt = new Date();
  await victimCase.save();
  res.status(201).json({ success: true, message: 'Victim assigned successfully.', data: { caseId: victimCase._id, victimId: victim._id, officerId: staff._id } });
});

module.exports = {
  getWelfareOfficers,
  getWelfareOfficer,
  createWelfareOfficer,
  updateWelfareOfficer,
  setWelfareOfficerStatus,
  getWelfareStats,
  getEligibleWelfareVictims,
  assignVictimToWelfareOfficer,
  SPECIALIZATIONS,
  OFFICER_ROLE
};
