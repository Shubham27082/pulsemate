const prisma = require('../config/database');
const { sendOtp, verifyOtp } = require('../services/otp.service');
const {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} = require('../services/token.service');
const { hashValue, compareHash } = require('../utils/crypto');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const logger = require('../config/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * POST /api/auth/send-otp
 * Send OTP to mobile number
 */
const sendOtpHandler = async (req, res, next) => {
  try {
    const { mobile, purpose } = req.body;
    const result = await sendOtp(mobile, purpose);
    return sendSuccess(res, result, 'OTP sent successfully');
  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login/register patient
 */
const verifyOtpHandler = async (req, res, next) => {
  try {
    const { mobile, otp, purpose, name } = req.body;

    await verifyOtp(mobile, otp, purpose);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { mobile } });
    let isNewUser = false;

    if (!user) {
      // New patient registration
      user = await prisma.user.create({
        data: {
          mobile,
          name: name || null,
          role: 'PATIENT',
          patientProfile: { create: {} },
        },
        include: { patientProfile: true },
      });
      isNewUser = true;
      logger.info(`New patient registered: ${mobile}`);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been disabled. Contact support.', 403);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'USER_REGISTERED' : 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          isNewUser,
        },
      },
      isNewUser ? 'Account created successfully' : 'Login successful'
    );
  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    next(error);
  }
};

/**
 * POST /api/auth/login-password
 * Staff login with mobile/email + password
 */
const loginPasswordHandler = async (req, res, next) => {
  try {
    const { mobile, email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: mobile ? { mobile } : { email },
    });

    if (!user || !user.passwordHash) {
      return sendError(res, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account has been disabled', 403);
    }

    const isValid = await compareHash(password, user.passwordHash);
    if (!isValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
      },
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Rotate refresh token and issue new access token
 */
const refreshTokenHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return sendError(res, 'Refresh token not found', 401);
    }

    const { accessToken, refreshToken, user } = await rotateRefreshToken(token);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return sendSuccess(res, {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
      },
    }, 'Token refreshed');
  } catch (error) {
    if (error.status) {
      res.clearCookie('refreshToken');
      return sendError(res, error.message, error.status);
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Revoke refresh token and clear cookie
 */
const logoutHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await revokeRefreshToken(token);
    }

    res.clearCookie('refreshToken', { path: '/' });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user.id,
        ipAddress: req.ip,
      });
    }

    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMeHandler = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        patientProfile: true,
        doctorProfile: true,
        clinicStaff: {
          where: { isActive: true },
          include: { clinic: { select: { id: true, name: true, city: true } } },
        },
      },
    });

    return sendSuccess(res, { user }, 'User profile fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtpHandler,
  verifyOtpHandler,
  loginPasswordHandler,
  refreshTokenHandler,
  logoutHandler,
  getMeHandler,
};
