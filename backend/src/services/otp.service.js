const otpRepository = require('../repositories/otp.repository');
const logger = require('../config/logger');
const { generateOtp, hashOtp, verifyOtpHash } = require('../utils/hash');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);

const dispatchOtp = async (mobile, otp) => {
  const provider = process.env.OTP_PROVIDER || 'console';

  switch (provider) {
    case 'twilio': {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your PulseMate OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
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
      break;
  }
};

const sendOtp = async (mobile, purpose = 'LOGIN') => {
  const recent = await otpRepository.findRecentActive(
    mobile,
    purpose,
    new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000)
  );

  if (recent) {
    const secondsLeft = Math.ceil((recent.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
    const error = new Error(`Please wait ${secondsLeft} seconds before requesting a new OTP`);
    error.status = 429;
    throw error;
  }

  await otpRepository.invalidateOutstanding(mobile, purpose);

  const otp = generateOtp(6);
  await otpRepository.create({
    mobile,
    purpose,
    otpHash: await hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  await dispatchOtp(mobile, otp);

  return {
    message: 'OTP sent successfully',
  };
};

const verifyOtp = async (mobile, otp, purpose = 'LOGIN') => {
  const record = await otpRepository.findLatestValid(mobile, purpose);

  if (!record) {
    const error = new Error('OTP expired or not found. Please request a new OTP.');
    error.status = 400;
    throw error;
  }

  if (record.attempts >= record.maxAttempts) {
    await otpRepository.update(record.id, { isUsed: true });
    const error = new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
    error.status = 429;
    throw error;
  }

  const isValid = await verifyOtpHash(otp, record.otpHash);
  await otpRepository.update(record.id, {
    attempts: { increment: 1 },
    ...(isValid ? { isUsed: true, verifiedAt: new Date() } : {}),
  });

  if (!isValid) {
    const remaining = Math.max(record.maxAttempts - (record.attempts + 1), 0);
    const error = new Error(`Invalid OTP. ${remaining} attempts remaining.`);
    error.status = 400;
    throw error;
  }

  return true;
};

module.exports = {
  sendOtp,
  verifyOtp,
};
