const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Victim = require('../models/Victim');
const Counselor = require('../models/Counselor');
const { generateToken } = require('../utils/jwt');

// @desc    Register a new victim
// @route   POST /api/v1/auth/register/victim
// @access  Public
const registerVictim = asyncHandler(async (req, res) => {
  const { email, password, name, phone, emergencyContact } = req.body;

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
    role: 'victim',
    status: 'active'
  });

  const victim = await Victim.create({
    userId: user._id,
    name,
    phone,
    emergencyContact
  });

  res.status(201).json({
    success: true,
    data: {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: victim.name,
      token: generateToken(user._id, user.role)
    }
  });
});

// @desc    Register a new counselor
// @route   POST /api/v1/auth/register/counselor
// @access  Public
const registerCounselor = asyncHandler(async (req, res) => {
  const { email, password, name, phone, qualifications } = req.body;

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
    status: 'pending'
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

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    
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
        token: generateToken(user._id, user.role)
      }
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
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

module.exports = {
  registerVictim,
  registerCounselor,
  login,
  getMe
};
