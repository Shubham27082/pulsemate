const crypto = require('crypto');
const passwordResetRepository = require('../repositories/password-reset.repository');
const { hashToken, hashPassword } = require('../utils/hash');
const { validatePasswordStrength } = require('../utils/password-policy');

const DEFAULT_RESET_EXPIRY_MS = 15 * 60 * 1000;
const SUPER_ADMIN_RESET_EXPIRY_MS = 10 * 60 * 1000;

const hashResetToken = (rawToken) => hashToken(rawToken);

const invalidateOldResetTokens = async (userId, purpose = undefined) => {
  if (purpose) {
    return passwordResetRepository.invalidateForUserByPurpose(userId, purpose);
  }
  return passwordResetRepository.invalidateForUser(userId);
};

const createPasswordResetToken = async (user) => {
  const purpose = user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN_RESET' : 'FORGOT_PASSWORD';
  const expiresAt = new Date(
    Date.now() + (purpose === 'SUPER_ADMIN_RESET' ? SUPER_ADMIN_RESET_EXPIRY_MS : DEFAULT_RESET_EXPIRY_MS)
  );

  await invalidateOldResetTokens(user.id);

  const rawToken = crypto.randomBytes(32).toString('hex');
  await passwordResetRepository.create({
    userId: user.id,
    tokenHash: hashResetToken(rawToken),
    purpose,
    expiresAt,
  });

  return {
    rawToken,
    purpose,
    expiresAt,
  };
};

const validatePasswordResetToken = async (rawToken) => {
  const stored = await passwordResetRepository.findByHash(hashResetToken(rawToken));

  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
    const error = new Error('Reset link is invalid or expired.');
    error.status = 400;
    throw error;
  }

  return stored;
};

const markTokenUsed = async (tokenId) => passwordResetRepository.markUsed(tokenId);

const applyPasswordReset = async (user, newPassword) => {
  validatePasswordStrength(newPassword);
  return {
    passwordHash: await hashPassword(newPassword),
  };
};

module.exports = {
  createPasswordResetToken,
  validatePasswordResetToken,
  markTokenUsed,
  invalidateOldResetTokens,
  hashResetToken,
  applyPasswordReset,
  DEFAULT_RESET_EXPIRY_MS,
  SUPER_ADMIN_RESET_EXPIRY_MS,
};
