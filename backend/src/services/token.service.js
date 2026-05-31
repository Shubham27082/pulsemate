const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const refreshTokenRepository = require('../repositories/refresh-token.repository');
const { hashToken } = require('../utils/hash');

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const randomId = () => crypto.randomUUID();

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      status: user.approvalStatus,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

const signRefreshToken = (user, jwtId) =>
  jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
      jti: jwtId,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);
const PHONE_VERIFICATION_SECRET = process.env.JWT_RESET_SECRET || process.env.JWT_ACCESS_SECRET;
const PHONE_VERIFICATION_EXPIRY = process.env.JWT_PHONE_VERIFY_EXPIRY || '30m';
const EMAIL_VERIFICATION_EXPIRY = process.env.JWT_EMAIL_VERIFY_EXPIRY || '30m';

const signPhoneVerificationToken = (phone, context = 'CLINIC_OWNER_REGISTER') =>
  jwt.sign(
    {
      phone,
      type: 'phone_verification',
      context,
    },
    PHONE_VERIFICATION_SECRET,
    { expiresIn: PHONE_VERIFICATION_EXPIRY }
  );

const verifyPhoneVerificationToken = (token) => jwt.verify(token, PHONE_VERIFICATION_SECRET);

const signEmailVerificationToken = (email, context = 'CLINIC_OWNER_REGISTER') =>
  jwt.sign(
    {
      email,
      type: 'email_verification',
      context,
    },
    PHONE_VERIFICATION_SECRET,
    { expiresIn: EMAIL_VERIFICATION_EXPIRY }
  );

const verifyEmailVerificationToken = (token) => jwt.verify(token, PHONE_VERIFICATION_SECRET);

const buildTokenPayload = async (user, metadata = {}) => {
  const jwtId = randomId();
  const refreshToken = signRefreshToken(user, jwtId);
  const refreshTokenHash = hashToken(refreshToken);
  const stored = await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: refreshTokenHash,
    jwtId,
    expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
    deviceInfo: metadata.deviceInfo || null,
    ipAddress: metadata.ipAddress || null,
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    refreshTokenRecord: stored,
    accessTokenMaxAge: ACCESS_COOKIE_MAX_AGE,
    refreshTokenMaxAge: REFRESH_COOKIE_MAX_AGE,
  };
};

const createSessionTokens = async (user, _role, metadata = {}) => {
  const payload = await buildTokenPayload(user, metadata);
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    refreshExpiry: REFRESH_EXPIRY,
    session: { id: payload.refreshTokenRecord.id },
  };
};

const rotateRefreshToken = async (rawRefreshToken, _role, metadata = {}) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (error) {
    const authError = new Error('Invalid or expired refresh token');
    authError.status = 401;
    throw authError;
  }

  const stored = await refreshTokenRepository.findActiveByHash(hashToken(rawRefreshToken));
  if (!stored || stored.jwtId !== decoded.jti || stored.userId !== decoded.sub) {
    const authError = new Error('Invalid or expired refresh token');
    authError.status = 401;
    throw authError;
  }

  const next = await buildTokenPayload(stored.user, {
    deviceInfo: metadata.deviceInfo || stored.deviceInfo,
    ipAddress: metadata.ipAddress || stored.ipAddress,
  });

  await refreshTokenRepository.revokeById(stored.id, {
    replacedByToken: next.refreshTokenRecord.id,
  });

  return {
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
    refreshExpiry: REFRESH_EXPIRY,
    session: { id: next.refreshTokenRecord.id },
    user: stored.user,
  };
};

const revokeRefreshToken = async (rawRefreshToken) => {
  await refreshTokenRepository.revokeByHash(hashToken(rawRefreshToken));
};

const revokeAllUserTokens = async (userId) => {
  await refreshTokenRepository.revokeAllForUser(userId);
};

const revokeAllRefreshTokens = async (userId) => {
  await refreshTokenRepository.revokeAllForUser(userId);
};

const revokeRoleSessions = async (userId) => {
  await refreshTokenRepository.revokeAllForUser(userId);
};

module.exports = {
  ACCESS_EXPIRY,
  REFRESH_EXPIRY,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
  signAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
  createSessionTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  revokeAllRefreshTokens,
  revokeRoleSessions,
  signPhoneVerificationToken,
  verifyPhoneVerificationToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
};
