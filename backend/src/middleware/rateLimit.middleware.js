const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development';

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max: isDev ? 1000 : max,
    skip: () => isDev,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

const otpSendLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please try again later.',
});

const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many OTP verification attempts. Please try again later.',
});

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
});

const forgotPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
});

const emailVerificationSendLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many email verification requests. Please try again later.',
});

const emailVerificationVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many email verification attempts. Please try again later.',
});

const resetPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts. Please try again later.',
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  emailVerificationSendLimiter,
  emailVerificationVerifyLimiter,
  resetPasswordLimiter,
};
