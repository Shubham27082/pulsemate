const express = require('express');
const {
  patientSendOtpHandler,
  patientVerifyOtpHandler,
  clinicOwnerSendOtpHandler,
  clinicOwnerVerifyOtpHandler,
  clinicOwnerSendEmailOtpHandler,
  clinicOwnerVerifyEmailOtpHandler,
  clinicOwnerUploadDocumentHandler,
  registerClinicOwnerHandler,
  registerDoctorHandler,
  loginHandler,
  createReceptionistHandler,
  createAdminHandler,
  lookupPincodeHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyResetTokenHandler,
  refreshTokenHandler,
  logoutHandler,
  logoutAllHandler,
  getMeHandler,
} = require('../controllers/auth.controller');
const { clinicOwnerUpload } = require('../middleware/upload.middleware');
const { authenticateUser, requireSuperAdmin, requireAdminLevel, requireClinicOwner, requireVerifiedAccount } = require('../middleware/auth.middleware');
const { otpSendLimiter, otpVerifyLimiter, loginLimiter, forgotPasswordLimiter, emailVerificationSendLimiter, emailVerificationVerifyLimiter, resetPasswordLimiter } = require('../middleware/rateLimit.middleware');
const {
  patientSendOtpSchema,
  patientVerifyOtpSchema,
  clinicOwnerOtpSendSchema,
  clinicOwnerOtpVerifySchema,
  clinicOwnerEmailVerificationSendSchema,
  clinicOwnerEmailOtpVerifySchema,
  clinicOwnerEmailVerificationTokenSchema,
  clinicOwnerRegisterSchema,
  doctorRegisterSchema,
  commonLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
  createReceptionistSchema,
  adminCreateSchema,
  validateRequest,
  validateQuery,
} = require('../validations/auth.validation');

const router = express.Router();

router.post('/patient/send-otp', otpSendLimiter, validateRequest(patientSendOtpSchema), patientSendOtpHandler);
router.post('/patient/verify-otp', otpVerifyLimiter, validateRequest(patientVerifyOtpSchema), patientVerifyOtpHandler);
router.post('/clinic-owner/send-otp', otpSendLimiter, validateRequest(clinicOwnerOtpSendSchema), clinicOwnerSendOtpHandler);
router.post('/clinic-owner/verify-otp', otpVerifyLimiter, validateRequest(clinicOwnerOtpVerifySchema), clinicOwnerVerifyOtpHandler);
router.post('/clinic-owner/send-email-otp', emailVerificationSendLimiter, validateRequest(clinicOwnerEmailVerificationSendSchema), clinicOwnerSendEmailOtpHandler);
router.post('/clinic-owner/verify-email-otp', emailVerificationVerifyLimiter, validateRequest(clinicOwnerEmailOtpVerifySchema), clinicOwnerVerifyEmailOtpHandler);
router.post('/clinic-owner/send-email-verification', emailVerificationSendLimiter, validateRequest(clinicOwnerEmailVerificationSendSchema), clinicOwnerSendEmailOtpHandler);
router.get('/clinic-owner/verify-email', emailVerificationVerifyLimiter, validateQuery(clinicOwnerEmailVerificationTokenSchema), clinicOwnerVerifyEmailOtpHandler);
router.post('/send-email-verification', emailVerificationSendLimiter, validateRequest(clinicOwnerEmailVerificationSendSchema), clinicOwnerSendEmailOtpHandler);
router.get('/verify-email-token', emailVerificationVerifyLimiter, validateQuery(clinicOwnerEmailVerificationTokenSchema), clinicOwnerVerifyEmailOtpHandler);
router.post('/clinic-owner/upload-document', clinicOwnerUpload.single('file'), clinicOwnerUploadDocumentHandler);
router.get('/pincode/:pincode', lookupPincodeHandler);

router.post('/clinic-owner/register', validateRequest(clinicOwnerRegisterSchema), registerClinicOwnerHandler);
router.post('/doctor/register', validateRequest(doctorRegisterSchema), registerDoctorHandler);

router.post('/login', loginLimiter, validateRequest(commonLoginSchema), loginHandler);
router.post('/forgot-password', forgotPasswordLimiter, validateRequest(forgotPasswordSchema), forgotPasswordHandler);
router.get('/verify-reset-token', validateQuery(verifyResetTokenSchema), verifyResetTokenHandler);
router.post('/reset-password', resetPasswordLimiter, validateRequest(resetPasswordSchema), resetPasswordHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logoutHandler);
router.post('/logout-all', authenticateUser, logoutAllHandler);
router.get('/me', authenticateUser, getMeHandler);

router.post(
  '/admin/create',
  authenticateUser,
  requireSuperAdmin,
  requireAdminLevel('ROOT'),
  validateRequest(adminCreateSchema),
  createAdminHandler
);

router.post(
  '/clinic/receptionists',
  authenticateUser,
  requireClinicOwner,
  requireVerifiedAccount,
  validateRequest(createReceptionistSchema),
  createReceptionistHandler
);

// Backward-compatible endpoints while the rest of the app migrates
router.post('/send-otp', otpSendLimiter, validateRequest(patientSendOtpSchema), patientSendOtpHandler);
router.post('/verify-otp', otpVerifyLimiter, validateRequest(patientVerifyOtpSchema), patientVerifyOtpHandler);
router.post('/login-password', loginLimiter, validateRequest(commonLoginSchema), loginHandler);

module.exports = router;
