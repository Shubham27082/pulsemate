const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  patientSendOtpHandler,
  patientVerifyOtpHandler,
  registerClinicOwnerHandler,
  registerDoctorHandler,
  clinicOwnerLoginHandler,
  doctorLoginHandler,
  receptionistLoginHandler,
  adminLoginHandler,
  clinicOwnerRefreshHandler,
  doctorRefreshHandler,
  receptionistRefreshHandler,
  adminRefreshHandler,
  patientRefreshHandler,
  clinicOwnerLogoutHandler,
  doctorLogoutHandler,
  receptionistLogoutHandler,
  adminLogoutHandler,
  patientLogoutHandler,
  createReceptionistHandler,
  createAdminHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMeHandler,
  sendOtpHandler,
  verifyOtpHandler,
  loginPasswordHandler,
  refreshTokenHandler,
  logoutHandler,
} = require('../controllers/auth.controller');
const {
  authenticate,
  requireRole,
  requireApprovalStatuses,
  requireAdminLevel,
  requireClinicVerified,
} = require('../middleware/auth.middleware');
const {
  validate,
  sendOtpSchema,
  verifyOtpSchema,
  loginPasswordSchema,
  clinicOwnerRegisterSchema,
  doctorRegisterSchema,
  receptionistCreateSchema,
  adminCreateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

const router = express.Router();

const isDev = process.env.NODE_ENV === 'development';
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 5,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  skip: () => isDev,
});

router.post('/patient/send-otp', otpLimiter, validate(sendOtpSchema), patientSendOtpHandler);
router.post('/patient/verify-otp', otpLimiter, validate(verifyOtpSchema), patientVerifyOtpHandler);
router.post('/patient/refresh-token', patientRefreshHandler);
router.post('/patient/logout', authenticate, requireRole('PATIENT'), patientLogoutHandler);

router.post('/clinic-owner/register', validate(clinicOwnerRegisterSchema), registerClinicOwnerHandler);
router.post('/clinic-owner/login', loginLimiter, validate(loginPasswordSchema), clinicOwnerLoginHandler);
router.post('/clinic-owner/refresh-token', clinicOwnerRefreshHandler);
router.post('/clinic-owner/logout', authenticate, requireRole('CLINIC_OWNER'), clinicOwnerLogoutHandler);

router.post('/doctor/register', validate(doctorRegisterSchema), registerDoctorHandler);
router.post('/doctor/login', loginLimiter, validate(loginPasswordSchema), doctorLoginHandler);
router.post('/doctor/refresh-token', doctorRefreshHandler);
router.post('/doctor/logout', authenticate, requireRole('DOCTOR'), doctorLogoutHandler);

router.post('/receptionist/login', loginLimiter, validate(loginPasswordSchema), receptionistLoginHandler);
router.post('/receptionist/refresh-token', receptionistRefreshHandler);
router.post('/receptionist/logout', authenticate, requireRole('RECEPTIONIST'), receptionistLogoutHandler);

router.post('/admin/login', loginLimiter, validate(loginPasswordSchema), adminLoginHandler);
router.post('/admin/refresh-token', adminRefreshHandler);
router.post('/admin/logout', authenticate, requireRole('SUPER_ADMIN'), adminLogoutHandler);
router.post(
  '/admin/create',
  authenticate,
  requireRole('SUPER_ADMIN'),
  requireAdminLevel('ROOT'),
  validate(adminCreateSchema),
  createAdminHandler
);

router.post(
  '/receptionists',
  authenticate,
  requireRole('CLINIC_OWNER'),
  requireApprovalStatuses('VERIFIED'),
  validate(receptionistCreateSchema),
  requireClinicVerified,
  createReceptionistHandler
);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);

router.get('/me', authenticate, getMeHandler);

// Backward compatibility endpoints while frontend is migrated
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), sendOtpHandler);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), verifyOtpHandler);
router.post('/login-password', loginLimiter, validate(loginPasswordSchema), loginPasswordHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', authenticate, logoutHandler);

module.exports = router;
