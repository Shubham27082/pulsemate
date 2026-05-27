const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sessionRepository = require('../repositories/session.repository');
const { hashToken } = require('../utils/crypto');
const { ACCESS_EXPIRY, REFRESH_EXPIRY, REFRESH_EXPIRY_MS } = require('../constants/auth');
const logger = require('../config/logger');

const generateAccessToken = (user, sessionId) =>
  jwt.sign(
    {
      userId: user.id,
      role: user.role,
      approvalStatus: user.approvalStatus,
      adminLevel: user.adminProfile?.level || null,
      sessionId,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

const createRefreshToken = () => crypto.randomBytes(48).toString('hex');

const createSessionTokens = async (user, authRole, metadata = {}) => {
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

  const session = await sessionRepository.create({
    userId: user.id,
    refreshTokenHash,
    authRole,
    deviceInfo: metadata.deviceInfo || null,
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null,
    expiresAt,
  });

  return {
    accessToken: generateAccessToken(user, session.id),
    refreshToken,
    session,
    refreshExpiry: REFRESH_EXPIRY,
  };
};

const rotateRefreshToken = async (rawRefreshToken, authRole, metadata = {}) => {
  const refreshTokenHash = hashToken(rawRefreshToken);
  const stored = await sessionRepository.findActiveByHash(refreshTokenHash, authRole);

  if (!stored) {
    const error = new Error('Invalid or expired refresh token');
    error.status = 401;
    throw error;
  }

  if (!stored.user.isActive || stored.user.approvalStatus === 'SUSPENDED') {
    await sessionRepository.revokeById(stored.id);
    const error = new Error('Account is suspended');
    error.status = 403;
    throw error;
  }

  await sessionRepository.revokeById(stored.id);
  const next = await createSessionTokens(stored.user, authRole, {
    ...metadata,
    deviceInfo: metadata.deviceInfo || stored.deviceInfo,
    ipAddress: metadata.ipAddress || stored.ipAddress,
    userAgent: metadata.userAgent || stored.userAgent,
  });

  return { ...next, user: stored.user };
};

const revokeRefreshToken = async (rawRefreshToken, authRole) => {
  const refreshTokenHash = hashToken(rawRefreshToken);
  await sessionRepository.revokeByHash(refreshTokenHash, authRole);
};

const revokeAllUserTokens = async (userId) => {
  await sessionRepository.revokeAllForUser(userId);
};

const revokeRoleSessions = async (userId, authRole) => {
  await sessionRepository.revokeAllForRole(userId, authRole);
};

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);

module.exports = {
  ACCESS_EXPIRY,
  REFRESH_EXPIRY,
  generateAccessToken,
  createSessionTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  revokeRoleSessions,
  verifyAccessToken,
};
