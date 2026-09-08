const jwt = require('jsonwebtoken');

const generateToken = (userId, role, email) => {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

module.exports = { generateToken };
