const crypto = require('crypto');
const passwordResetRepository = require('../repositories/password-reset.repository');
const userRepository = require('../repositories/user.repository');
const { hashToken, hashValue } = require('../utils/crypto');
const { validatePasswordStrength } = require('../utils/password-policy');
const { createAuditLog } = require('./audit.service');

const RESET_EXPIRY_MS = 30 * 60 * 1000;

const issueResetToken = async (user, metadata = {}) => {
  await passwordResetRepository.invalidateForUser(user.id);
  const rawToken = crypto.randomBytes(32).toString('hex');
  await passwordResetRepository.create({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_EXPIRY_MS),
  });

  await createAuditLog({
    userId: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'User',
    entityId: user.id,
    ipAddress: metadata.ipAddress,
  });

  return rawToken;
};

const resetPassword = async (rawToken, nextPassword, metadata = {}) => {
  validatePasswordStrength(nextPassword);
  const stored = await passwordResetRepository.findActiveByHash(hashToken(rawToken));
  if (!stored) {
    const error = new Error('Reset token is invalid or expired');
    error.status = 400;
    throw error;
  }

  const passwordHash = await hashValue(nextPassword);
  await userRepository.update(stored.userId, { passwordHash });
  await passwordResetRepository.markUsed(stored.id);

  await createAuditLog({
    userId: stored.userId,
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'User',
    entityId: stored.userId,
    ipAddress: metadata.ipAddress,
  });

  return stored.user;
};

module.exports = {
  issueResetToken,
  resetPassword,
};
