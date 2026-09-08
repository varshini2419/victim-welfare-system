const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId || decoded._id).select('-passwordHash');

      if (!user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Check account status globally (pending shouldn't even be able to login, but just in case)
      if (user.status === 'suspended') {
        res.status(403);
        throw new Error('Account suspended');
      }

      req.user = user;
      req.user.userId = user._id;
      req.user.id = user._id;
      req.user.email = user.email;
      req.user.role = user.role;
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`);
    }
    next();
  };
};

module.exports = { protect, authorize };
