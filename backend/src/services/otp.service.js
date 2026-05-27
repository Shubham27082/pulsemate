const otpRepository = require('../repositories/otp.repository');
const { compareHash, generateOtp, hashValue } = require('../utils/crypto');
const logger = require('../config/logger');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const OTP_RESEND_COOLDOWN = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);

const dispatchOtp = async (mobile, otp) => {
  const provider = process.env.OTP_PROVIDER || 'console';

  switch (provider) {
    case 'twilio': {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your PulseMate OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: mobile,
      });
      break;
    }
    case 'msg91':
      logger.info(`MSG91 OTP dispatch queued for ${mobile}`);
      break;
    case 'fast2sms':
      logger.info(`Fast2SMS OTP dispatch queued for ${mobile}`);
      break;
    case 'console':
    default:
      logger.info(`[DEV OTP] ${mobile}: ${otp}`);
      console.log(`\nOTP for ${mobile}: ${otp}\n`);
      break;
  }
};

const sendOtp = async (mobile, purpose = 'LOGIN') => {
  const recentOtp = await otpRepository.findRecentUnverified(
    mobile,
    purpose,
    new Date(Date.now() - OTP_RESEND_COOLDOWN * 1000)
  );

  if (recentOtp) {
    const secondsLeft = Math.ceil(
      (recentOtp.createdAt.getTime() + OTP_RESEND_COOLDOWN * 1000 - Date.now()) / 1000
    );
    const error = new Error(`Please wait ${secondsLeft} seconds before requesting a new OTP`);
    error.status = 429;
    throw error;
  }

  await otpRepository.invalidateOutstanding(mobile, purpose);

  const otp = generateOtp(6);
  const otpHash = await hashValue(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await otpRepository.create({ mobile, purpose, otpHash, expiresAt });
  await dispatchOtp(mobile, otp);

  const response = { message: 'OTP sent successfully' };
  if (process.env.NODE_ENV !== 'production' || process.env.OTP_PROVIDER === 'console') {
    response.devOtp = otp;
  }
  return response;
};

const verifyOtp = async (mobile, otp, purpose = 'LOGIN') => {
  const otpRecord = await otpRepository.findLatestValid(mobile, purpose);

  if (!otpRecord) {
    const error = new Error('OTP expired or not found. Please request a new OTP.');
    error.status = 400;
    throw error;
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    const error = new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
    error.status = 429;
    throw error;
  }

  await otpRepository.update(otpRecord.id, {
    attempts: { increment: 1 },
  });

  const isValid = await compareHash(otp, otpRecord.otpHash);
  if (!isValid) {
    const error = new Error(
      `Invalid OTP. ${Math.max(OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1), 0)} attempts remaining.`
    );
    error.status = 400;
    throw error;
  }

  await otpRepository.update(otpRecord.id, { verifiedAt: new Date() });
  return true;
};

module.exports = { sendOtp, verifyOtp };
