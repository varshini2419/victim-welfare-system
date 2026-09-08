const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const OTP_EXPIRY_MINUTES = 15;

const createOtp = async () => {
  const value = crypto.randomInt(100000, 1000000).toString();
  const hash = await bcrypt.hash(value, 10);

  return {
    value,
    hash,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  };
};

module.exports = {
  createOtp,
  OTP_EXPIRY_MINUTES
};
