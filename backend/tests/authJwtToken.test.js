const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../src/utils/jwt');

const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'test-secret';

test('generateToken includes the credentialed user id, email and role for counselor login', () => {
  const userId = '64b5b9bfa6d1c2e4f8a7b6c5';
  const email = 'nisha@example.com';
  const token = generateToken(userId, 'counselor', email);
  const decoded = jwt.decode(token);

  assert.equal(decoded.userId, userId);
  assert.equal(decoded.email, email);
  assert.equal(decoded.role, 'counselor');
});

test.after(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});
