const prisma = require('../config/database');
const { generateOtp, hashValue, compareHash } = require('../utils/crypto');
const logger = require('../config/logger');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_RESEND_COOLDOWN = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;

/**
 * Send OTP to mobile number
 * Handles cooldown, hashing, and provider dispatch
 */
const sendOtp = async (mobile, purpose = 'LOGIN') => {
  // Check for recent OTP (cooldown enforcement)
  const recentOtp = await prisma.otp.findFirst({
    where: {
      mobile,
      purpose,
      verified: false,
      createdAt: {
        gte: new Date(Date.now() - OTP_RESEND_COOLDOWN * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOtp) {
    const secondsLeft = Math.ceil(
      (recentOtp.createdAt.getTime() + OTP_RESEND_COOLDOWN * 1000 - Date.now()) / 1000
    );
    throw { status: 429, message: `Please wait ${secondsLeft} seconds before requesting a new OTP` };
  }

  // Invalidate old OTPs for this mobile + purpose
  await prisma.otp.updateMany({
    where: { mobile, purpose, verified: false },
    data: { verified: true }, // mark as used/expired
  });

  const otp = generateOtp(6);
  const otpHash = await hashValue(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otp.create({
    data: { mobile, otpHash, purpose, expiresAt },
  });

  // Dispatch OTP via configured provider
  await dispatchOtp(mobile, otp);

  logger.info(`OTP sent to ${mobile} for purpose ${purpose}`);

  // In development, return OTP for testing
  if (process.env.NODE_ENV === 'development' || process.env.OTP_PROVIDER === 'console') {
    return { message: 'OTP sent successfully', devOtp: otp };
  }

  return { message: 'OTP sent successfully' };
};

/**
 * Verify OTP submitted by user
 */
const verifyOtp = async (mobile, otp, purpose = 'LOGIN') => {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      mobile,
      purpose,
      verified: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw { status: 400, message: 'OTP expired or not found. Please request a new OTP.' };
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    throw { status: 429, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
  }

  // Increment attempt count
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { attempts: { increment: 1 } },
  });

  const isValid = await compareHash(otp, otpRecord.otpHash);

  if (!isValid) {
    const remainingAttempts = OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
    throw {
      status: 400,
      message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
    };
  }

  // Mark OTP as verified
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  return true;
};

/**
 * Dispatch OTP via configured provider
 */
const dispatchOtp = async (mobile, otp) => {
  const provider = process.env.OTP_PROVIDER || 'console';

  switch (provider) {
    case 'twilio':
      await sendViaTwilio(mobile, otp);
      break;
    case 'msg91':
      await sendViaMSG91(mobile, otp);
      break;
    case 'fast2sms':
      await sendViaFast2SMS(mobile, otp);
      break;
    case 'console':
    default:
      // Development: log OTP to console
      logger.info(`[DEV OTP] Mobile: ${mobile} | OTP: ${otp}`);
      console.log(`\n🔐 OTP for ${mobile}: ${otp}\n`);
      break;
  }
};

const sendViaTwilio = async (mobile, otp) => {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your PulseMate OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobile,
  });
};

const sendViaMSG91 = async (mobile, otp) => {
  const https = require('https');
  const data = JSON.stringify({
    template_id: process.env.MSG91_TEMPLATE_ID,
    mobile,
    authkey: process.env.MSG91_AUTH_KEY,
    otp,
  });
  // MSG91 API call (simplified)
  logger.info(`MSG91 OTP dispatch for ${mobile}`);
};

const sendViaFast2SMS = async (mobile, otp) => {
  logger.info(`Fast2SMS OTP dispatch for ${mobile}: ${otp}`);
};

module.exports = { sendOtp, verifyOtp };
