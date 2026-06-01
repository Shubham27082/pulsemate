const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

/**
 * Hash a plain text value (password or OTP)
 */
const hashValue = async (value) => {
  return bcrypt.hash(String(value), SALT_ROUNDS);
};

/**
 * Compare plain text with hash
 */
const compareHash = async (value, hash) => {
  return bcrypt.compare(String(value), hash);
};

/**
 * Generate a cryptographically secure random OTP
 */
const generateOtp = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

/**
 * Hash a token for storage (SHA-256, not bcrypt - for fast lookup)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = { hashValue, compareHash, generateOtp, hashToken };
