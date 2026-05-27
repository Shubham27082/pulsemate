const prisma = require('../config/database');
const userRepository = require('../repositories/user.repository');
const { sendOtp, verifyOtp } = require('../services/otp.service');
const {
  createSessionTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeRoleSessions,
} = require('../services/token.service');
const { issueResetToken, resetPassword } = require('../services/password-reset.service');
const { compareHash, hashValue } = require('../utils/crypto');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { AUTH_SCOPES, defaultCookieOptions } = require('../constants/auth');
const { validatePasswordStrength } = require('../utils/password-policy');

const getSessionMetadata = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'] || null,
  deviceInfo: req.headers['x-device-info'] || null,
});

const setScopeCookie = (res, scope, refreshToken) => {
  res.cookie(scope.cookieName, refreshToken, defaultCookieOptions(scope));
};

const clearScopeCookie = (res, scope) => {
  res.clearCookie(scope.cookieName, { path: scope.cookiePath });
};

const toAuthPayload = (user) => ({
  id: user.id,
  name: user.name,
  mobile: user.mobile,
  email: user.email,
  role: user.role,
  approvalStatus: user.approvalStatus,
  adminLevel: user.adminProfile?.level || null,
});

const buildMePayload = async (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile: true,
      doctorProfile: true,
      receptionistProfile: {
        include: { assignedClinic: true },
      },
      adminProfile: true,
      clinicStaff: {
        where: { isActive: true },
        include: { clinic: true },
      },
      ownedClinics: true,
    },
  });

const patientSendOtpHandler = async (req, res, next) => {
  try {
    const result = await sendOtp(req.body.mobile, req.body.purpose);
    return sendSuccess(res, result, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

const patientVerifyOtpHandler = async (req, res, next) => {
  try {
    const { mobile, otp, purpose, name } = req.body;
    await verifyOtp(mobile, otp, purpose);

    let user = await userRepository.findByMobile(mobile, { patientProfile: true, adminProfile: true });
    let isNewUser = false;

    if (!user) {
      user = await userRepository.create(
        {
          mobile,
          name: name || null,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: { create: {} },
        },
        { patientProfile: true, adminProfile: true }
      );
      isNewUser = true;
    }

    if (user.role !== 'PATIENT') {
      return sendError(res, 'This mobile number belongs to a staff account. Use staff login.', 403);
    }

    if (!user.isActive || user.approvalStatus === 'SUSPENDED') {
      return sendError(res, user.suspendedReason || 'Account is suspended', 403);
    }

    const scope = AUTH_SCOPES.PATIENT;
    const tokens = await createSessionTokens(user, scope.role, getSessionMetadata(req));
    setScopeCookie(res, scope, tokens.refreshToken);

    await userRepository.update(user.id, { lastLoginAt: new Date() });
    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'PATIENT_REGISTERED' : 'PATIENT_LOGIN_OTP',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        sessionId: tokens.session.id,
        user: { ...toAuthPayload(user), isNewUser },
      },
      isNewUser ? 'Patient account created successfully' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

const registerClinicOwnerHandler = async (req, res, next) => {
  try {
    const {
      ownerName,
      phone,
      email,
      password,
      clinicName,
      clinicAddress,
      city,
      state,
      pincode,
      clinicPhone,
      clinicLicenseDocument,
      gstNumber,
      openingHours,
      specialties,
    } = req.body;

    validatePasswordStrength(password);
    const existing = await userRepository.findByEmailOrMobile({ email, mobile: phone });
    if (existing) return sendError(res, 'User with this email or phone already exists', 409);

    const passwordHash = await hashValue(password);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: ownerName,
          mobile: phone,
          email,
          role: 'CLINIC_OWNER',
          approvalStatus: 'PENDING',
          passwordHash,
        },
      });

      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          ownerId: user.id,
          phone: clinicPhone,
          address: clinicAddress,
          city,
          state,
          pincode,
          clinicLicenseDocument,
          gstNumber: gstNumber || null,
          openingHours,
          specialties,
          isVerified: false,
          approvalStatus: 'PENDING',
        },
      });

      await tx.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      return { user, clinic };
    });

    await createAuditLog({
      userId: created.user.id,
      action: 'CLINIC_OWNER_REGISTERED',
      entityType: 'Clinic',
      entityId: created.clinic.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        user: toAuthPayload(created.user),
        clinic: created.clinic,
      },
      'Clinic owner registration submitted for admin approval',
      201
    );
  } catch (error) {
    next(error);
  }
};

const registerDoctorHandler = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      email,
      password,
      qualification,
      specialization,
      experienceYears,
      medicalRegistrationNumber,
      certificates,
      consultationFee,
      onlineAvailable,
      offlineAvailable,
      bio,
      languagesKnown,
    } = req.body;

    validatePasswordStrength(password);
    const existing = await userRepository.findByEmailOrMobile({ email, mobile: phone });
    if (existing) return sendError(res, 'User with this email or phone already exists', 409);

    const passwordHash = await hashValue(password);
    const doctor = await prisma.user.create({
      data: {
        name: fullName,
        mobile: phone,
        email,
        role: 'DOCTOR',
        approvalStatus: 'PENDING',
        passwordHash,
        doctorProfile: {
          create: {
            approvalStatus: 'PENDING',
            qualification,
            specialization,
            experienceYears,
            medicalRegistrationNumber,
            certificates,
            consultationFee,
            onlineAvailable,
            offlineAvailable,
            bio,
            languagesKnown,
          },
        },
      },
      include: { doctorProfile: true, adminProfile: true },
    });

    await createAuditLog({
      userId: doctor.id,
      action: 'DOCTOR_REGISTERED',
      entityType: 'User',
      entityId: doctor.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      { user: toAuthPayload(doctor), doctorProfile: doctor.doctorProfile },
      'Doctor registration submitted for admin approval',
      201
    );
  } catch (error) {
    next(error);
  }
};

const staffLoginFactory = (scopeKey) => async (req, res, next) => {
  try {
    const scope = AUTH_SCOPES[scopeKey];
    const { email, mobile, password } = req.body;
    const user = await userRepository.findByEmailOrMobile(
      { email, mobile },
      {
        adminProfile: true,
        doctorProfile: true,
        receptionistProfile: true,
      }
    );

    if (!user || !scope.allowedRoles.includes(user.role) || !user.passwordHash) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isValid = await compareHash(password, user.passwordHash);
    if (!isValid) return sendError(res, 'Invalid credentials', 401);

    if (!user.isActive) return sendError(res, 'Account is disabled', 403);
    if (user.approvalStatus === 'SUSPENDED') {
      return sendError(res, user.suspendedReason || 'Account is suspended', 403);
    }

    const tokens = await createSessionTokens(user, scope.role, getSessionMetadata(req));
    setScopeCookie(res, scope, tokens.refreshToken);
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    await createAuditLog({
      userId: user.id,
      action: `STAFF_LOGIN_${scope.role}`,
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      sessionId: tokens.session.id,
      user: toAuthPayload(user),
      accountState: {
        approvalStatus: user.approvalStatus,
        message:
          user.approvalStatus === 'PENDING'
            ? 'Your account is pending approval'
            : user.approvalStatus === 'REJECTED'
              ? user.rejectionReason || 'Your account has been rejected'
              : 'Login successful',
      },
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refreshFactory = (scopeKey) => async (req, res, next) => {
  try {
    const scope = AUTH_SCOPES[scopeKey];
    const rawToken = req.cookies?.[scope.cookieName];
    if (!rawToken) return sendError(res, 'Refresh token not found', 401);

    const refreshed = await rotateRefreshToken(rawToken, scope.role, getSessionMetadata(req));
    setScopeCookie(res, scope, refreshed.refreshToken);

    return sendSuccess(res, {
      accessToken: refreshed.accessToken,
      sessionId: refreshed.session.id,
      user: toAuthPayload(refreshed.user),
    }, 'Token refreshed');
  } catch (error) {
    clearScopeCookie(res, AUTH_SCOPES[scopeKey]);
    next(error);
  }
};

const logoutFactory = (scopeKey) => async (req, res, next) => {
  try {
    const scope = AUTH_SCOPES[scopeKey];
    const rawToken = req.cookies?.[scope.cookieName];
    if (rawToken) await revokeRefreshToken(rawToken, scope.role);
    clearScopeCookie(res, scope);

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: `LOGOUT_${scope.role}`,
        entityType: 'Session',
        entityId: req.session?.id,
        ipAddress: req.ip,
      });
    }

    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const createReceptionistHandler = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, assignedClinic } = req.body;

    const clinic = await prisma.clinic.findFirst({
      where: { id: assignedClinic, ownerId: req.user.id, approvalStatus: 'VERIFIED' },
    });
    if (!clinic) return sendError(res, 'Clinic not found or not verified', 404);

    const existing = await userRepository.findByEmailOrMobile({ email, mobile: phone });
    if (existing) return sendError(res, 'User with this email or phone already exists', 409);

    const passwordHash = await hashValue(password);
    const receptionist = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fullName,
          mobile: phone,
          email,
          role: 'RECEPTIONIST',
          approvalStatus: 'VERIFIED',
          passwordHash,
          receptionistProfile: {
            create: {
              assignedClinicId: assignedClinic,
              createdByOwnerId: req.user.id,
            },
          },
        },
        include: { receptionistProfile: true, adminProfile: true },
      });

      await tx.clinicStaff.create({
        data: {
          clinicId: assignedClinic,
          userId: user.id,
          role: 'RECEPTIONIST',
        },
      });

      return user;
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'RECEPTIONIST_CREATED',
      entityType: 'User',
      entityId: receptionist.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: toAuthPayload(receptionist) }, 'Receptionist created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const createAdminHandler = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, level } = req.body;
    const existing = await userRepository.findByEmailOrMobile({ email, mobile: phone });
    if (existing) return sendError(res, 'User with this email or phone already exists', 409);

    const passwordHash = await hashValue(password);
    const admin = await prisma.user.create({
      data: {
        name: fullName,
        mobile: phone,
        email,
        role: 'SUPER_ADMIN',
        approvalStatus: 'VERIFIED',
        passwordHash,
        adminProfile: {
          create: {
            level,
            createdById: req.user.id,
          },
        },
      },
      include: { adminProfile: true },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_CREATED',
      entityType: 'User',
      entityId: admin.id,
      metadata: { level },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: toAuthPayload(admin) }, 'Admin account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const forgotPasswordHandler = async (req, res, next) => {
  try {
    const user = await userRepository.findByEmailOrMobile(req.body, { adminProfile: true });
    if (!user) return sendSuccess(res, {}, 'If the account exists, reset instructions have been generated');
    if (user.role === 'PATIENT') {
      return sendSuccess(res, {}, 'Patients use OTP login. Use the patient OTP flow to access your account.');
    }

    const rawToken = await issueResetToken(user, getSessionMetadata(req));
    return sendSuccess(
      res,
      {
        ...(process.env.NODE_ENV !== 'production' ? { resetToken: rawToken } : {}),
      },
      'Password reset instructions have been generated'
    );
  } catch (error) {
    next(error);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  try {
    const user = await resetPassword(req.body.token, req.body.password, getSessionMetadata(req));
    await revokeRoleSessions(user.id, user.role);
    return sendSuccess(res, {}, 'Password reset successfully. Please sign in again.');
  } catch (error) {
    next(error);
  }
};

const getMeHandler = async (req, res, next) => {
  try {
    const user = await buildMePayload(req.user.id);
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { user, sessions }, 'User profile fetched');
  } catch (error) {
    next(error);
  }
};

const logoutCurrentScopeHandler = async (req, res, next) => {
  try {
    const scopeKey = req.user.role;
    const scope = AUTH_SCOPES[scopeKey];
    if (!scope) return sendError(res, 'Unsupported auth scope', 400);
    const rawToken = req.cookies?.[scope.cookieName];
    if (rawToken) await revokeRefreshToken(rawToken, scope.role);
    clearScopeCookie(res, scope);
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const sendOtpHandler = patientSendOtpHandler;
const verifyOtpHandler = patientVerifyOtpHandler;
const loginPasswordHandler = async (req, res, next) => {
  const user = await userRepository.findByEmailOrMobile(req.body, { adminProfile: true });
  if (!user) return sendError(res, 'Invalid credentials', 401);
  const scopeKey = user.role;
  if (!AUTH_SCOPES[scopeKey]) return sendError(res, 'Unsupported role login', 403);
  return staffLoginFactory(scopeKey)(req, res, next);
};
const refreshTokenHandler = async (req, res, next) => {
  for (const scope of Object.values(AUTH_SCOPES)) {
    if (req.cookies?.[scope.cookieName]) {
      return refreshFactory(scope.role)(req, res, next);
    }
  }
  return sendError(res, 'Refresh token not found', 401);
};
const logoutHandler = logoutCurrentScopeHandler;

module.exports = {
  patientSendOtpHandler,
  patientVerifyOtpHandler,
  registerClinicOwnerHandler,
  registerDoctorHandler,
  clinicOwnerLoginHandler: staffLoginFactory('CLINIC_OWNER'),
  doctorLoginHandler: staffLoginFactory('DOCTOR'),
  receptionistLoginHandler: staffLoginFactory('RECEPTIONIST'),
  adminLoginHandler: staffLoginFactory('SUPER_ADMIN'),
  clinicOwnerRefreshHandler: refreshFactory('CLINIC_OWNER'),
  doctorRefreshHandler: refreshFactory('DOCTOR'),
  receptionistRefreshHandler: refreshFactory('RECEPTIONIST'),
  adminRefreshHandler: refreshFactory('SUPER_ADMIN'),
  patientRefreshHandler: refreshFactory('PATIENT'),
  clinicOwnerLogoutHandler: logoutFactory('CLINIC_OWNER'),
  doctorLogoutHandler: logoutFactory('DOCTOR'),
  receptionistLogoutHandler: logoutFactory('RECEPTIONIST'),
  adminLogoutHandler: logoutFactory('SUPER_ADMIN'),
  patientLogoutHandler: logoutFactory('PATIENT'),
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
};
