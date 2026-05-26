const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  sendOtpHandler,
  verifyOtpHandler,
  loginPasswordHandler,
  refreshTokenHandler,
  logoutHandler,
  getMeHandler,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, sendOtpSchema, verifyOtpSchema, loginPasswordSchema } = require('../validators/auth.validator');

// Rate limiters — skipped entirely in development
const isDev = process.env.NODE_ENV === 'development';

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 5,
  skip: () => isDev,
  message: { success: false, message: 'Too many OTP requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  skip: () => isDev,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

router.post('/send-otp', otpLimiter, validate(sendOtpSchema), sendOtpHandler);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), verifyOtpHandler);
router.post('/login-password', loginLimiter, validate(loginPasswordSchema), loginPasswordHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, getMeHandler);

module.exports = router;
