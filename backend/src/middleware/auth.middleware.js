const { verifyAccessToken } = require('../services/token.service');
const { sendError } = require('../utils/response');
const prisma = require('../config/database');

/**
 * Authenticate request using JWT access token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Access token expired', 401);
      }
      return sendError(res, 'Invalid access token', 401);
    }

    // Fetch fresh user data to check isActive status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account has been disabled', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Authentication failed', 401);
  }
};

/**
 * Role-based authorization middleware factory
 * Usage: authorize('ADMIN', 'CLINIC_OWNER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    next();
  };
};

/**
 * Middleware to attach clinic context for staff operations
 * Verifies the user belongs to the requested clinic
 */
const requireClinicAccess = async (req, res, next) => {
  try {
    const clinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;

    if (!clinicId) {
      return sendError(res, 'Clinic ID is required', 400);
    }

    // Super admin has access to all clinics
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user is staff of this clinic
    const staffRecord = await prisma.clinicStaff.findFirst({
      where: {
        clinicId,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!staffRecord) {
      return sendError(res, 'You do not have access to this clinic', 403);
    }

    req.clinicStaff = staffRecord;
    next();
  } catch (error) {
    return sendError(res, 'Authorization check failed', 500);
  }
};

module.exports = { authenticate, authorize, requireClinicAccess };
