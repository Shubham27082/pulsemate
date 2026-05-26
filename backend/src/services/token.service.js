const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const { hashToken } = require('../utils/crypto');
const logger = require('../config/logger');

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      mobile: user.mobile,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
};

/**
 * Generate opaque refresh token, store hash in DB
 */
const generateRefreshToken = async (userId) => {
  const token = uuidv4() + '-' + uuidv4(); // long random token
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
};

/**
 * Verify and rotate refresh token
 * Returns new access + refresh tokens, revokes old refresh token
 */
const rotateRefreshToken = async (oldToken) => {
  const tokenHash = hashToken(oldToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    // Potential token reuse attack - revoke all tokens for this user if found
    if (stored) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revokedAt: new Date() },
      });
      logger.warn(`Refresh token reuse detected for user ${stored.userId}`);
    }
    throw { status: 401, message: 'Invalid or expired refresh token' };
  }

  if (!stored.user.isActive) {
    throw { status: 403, message: 'Account is disabled' };
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Issue new tokens
  const accessToken = generateAccessToken(stored.user);
  const newRefreshToken = await generateRefreshToken(stored.userId);

  return { accessToken, refreshToken: newRefreshToken, user: stored.user };
};

/**
 * Revoke a specific refresh token (logout)
 */
const revokeRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
const revokeAllUserTokens = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  verifyAccessToken,
};
