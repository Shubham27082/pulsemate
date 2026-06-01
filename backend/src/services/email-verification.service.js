const crypto = require('crypto');
const emailVerificationRepository = require('../repositories/email-verification.repository');
const { hashToken } = require('../utils/hash');
const logger = require('../config/logger');
const { sendClinicOwnerVerificationOtpEmail } = require('./email.service');

const EMAIL_VERIFICATION_EXPIRY_MINUTES = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES || '10', 10);
const EMAIL_VERIFICATION_MAX_ATTEMPTS = parseInt(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS || '5', 10);
const EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = parseInt(process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || '60', 10);

const generateEmailOtp = () => String(crypto.randomInt(100000, 999999));

const sendEmailVerification = async (email, ownerName) => {
  const normalizedEmail = email.toLowerCase();
  const recent = await emailVerificationRepository.findRecentActive(
    normalizedEmail,
    'CLINIC_OWNER_REGISTER',
    new Date(Date.now() - EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000)
  );

  if (recent) {
    const secondsLeft = Math.ceil((recent.createdAt.getTime() + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
    const error = new Error(`Please wait ${secondsLeft} seconds before requesting a new verification email`);
    error.status = 429;
    throw error;
  }

  await emailVerificationRepository.invalidateOutstanding(normalizedEmail, 'CLINIC_OWNER_REGISTER');

  const rawToken = generateEmailOtp();
  await emailVerificationRepository.create({
    email: normalizedEmail,
    purpose: 'CLINIC_OWNER_REGISTER',
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MINUTES * 60 * 1000),
    maxAttempts: EMAIL_VERIFICATION_MAX_ATTEMPTS,
  });

  await sendClinicOwnerVerificationOtpEmail(normalizedEmail, rawToken, ownerName);
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`Clinic owner email OTP for ${normalizedEmail}: ${rawToken}`);
  }

  return {
    message: 'Verification code sent successfully',
  };
};

const verifyEmailVerificationToken = async (emailOrToken, rawTokenMaybe) => {
  const hasEmailAndOtp = Boolean(rawTokenMaybe);
  const tokenValue = String(hasEmailAndOtp ? rawTokenMaybe : emailOrToken || '').trim();
  const tokenHash = hashToken(tokenValue);
  const stored = hasEmailAndOtp
    ? await emailVerificationRepository.findLatestValid(String(emailOrToken || '').toLowerCase(), 'CLINIC_OWNER_REGISTER')
    : await emailVerificationRepository.findByHash(tokenHash);

  if (!stored || stored.isUsed || stored.expiresAt <= new Date()) {
    const error = new Error(hasEmailAndOtp ? 'Email verification code is invalid or expired' : 'Email verification link is invalid or expired');
    error.status = 400;
    throw error;
  }

  if (stored.attempts >= stored.maxAttempts) {
    await emailVerificationRepository.update(stored.id, { isUsed: true });
    const error = new Error(hasEmailAndOtp ? 'Maximum verification attempts exceeded. Please request a new email code.' : 'Maximum verification attempts exceeded. Please request a new email.');
    error.status = 429;
    throw error;
  }

  const isValid = stored.tokenHash === tokenHash;
  await emailVerificationRepository.update(stored.id, {
    attempts: { increment: 1 },
    ...(isValid ? { isUsed: true, verifiedAt: new Date() } : {}),
  });

  if (!isValid) {
    const remaining = Math.max(stored.maxAttempts - (stored.attempts + 1), 0);
    const error = new Error(
      hasEmailAndOtp
        ? `Invalid verification code. ${remaining} attempts remaining.`
        : `Invalid verification link. ${remaining} attempts remaining.`
    );
    error.status = 400;
    throw error;
  }

  return stored;
};

const isEmailVerified = async (email, purpose = 'CLINIC_OWNER_REGISTER') => {
  const record = await emailVerificationRepository.findLatestVerified(email.toLowerCase(), purpose);
  return Boolean(record);
};

module.exports = {
  sendEmailVerification,
  verifyEmailVerificationToken,
  isEmailVerified,
  EMAIL_VERIFICATION_EXPIRY_MINUTES,
  EMAIL_VERIFICATION_MAX_ATTEMPTS,
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
};
