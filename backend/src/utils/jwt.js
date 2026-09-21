const jwt = require('jsonwebtoken');

const INVALID_JWT_SECRETS = new Set([
  'replace_with_a_long_random_secret',
  'supersecretjwtkey_replace_me_in_production',
]);

class JwtConfigurationError extends Error {
  constructor() {
    super('Authentication service is not configured. Please contact the administrator.');
    this.name = 'JwtConfigurationError';
  }
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || INVALID_JWT_SECRETS.has(secret)) {
    throw new JwtConfigurationError();
  }

  return secret;
};

const generateToken = (userId, role, email) => {
  return jwt.sign({ userId, email, role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

module.exports = { generateToken, getJwtSecret, JwtConfigurationError };
