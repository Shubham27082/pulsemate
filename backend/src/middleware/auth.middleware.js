const prisma = require('../config/database');
const { verifyAccessToken } = require('../services/token.service');
const { sendError } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.slice(7);
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return sendError(res, error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true,
        doctorProfile: true,
        receptionistProfile: true,
      },
    });

    if (!user) return sendError(res, 'User not found', 401);
    if (!user.isActive) return sendError(res, 'Account is disabled', 403);
    if (user.approvalStatus === 'SUSPENDED') return sendError(res, user.suspendedReason || 'Account is suspended', 403);

    const session = await prisma.session.findFirst({
      where: {
        id: decoded.sessionId,
        userId: user.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) return sendError(res, 'Session expired. Please sign in again.', 401);

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    return sendError(res, 'Authentication failed', 401);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  if (!roles.includes(req.user.role)) {
    return sendError(res, 'You do not have permission to perform this action', 403);
  }
  next();
};

const requireApprovalStatuses = (...statuses) => (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  if (!statuses.includes(req.user.approvalStatus)) {
    return sendError(res, `Account status ${req.user.approvalStatus} is not allowed for this action`, 403);
  }
  next();
};

const requireClinicVerified = async (req, res, next) => {
  const clinicId =
    req.params.clinicId ||
    req.params.id ||
    req.body.clinicId ||
    req.body.assignedClinic ||
    req.query.clinicId;
  if (!clinicId) return sendError(res, 'Clinic ID is required', 400);

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return sendError(res, 'Clinic not found', 404);
  if (clinic.approvalStatus !== 'VERIFIED') {
    return sendError(res, 'Clinic verification is pending or rejected', 403);
  }
  req.clinic = clinic;
  next();
};

const requireDoctorVerified = async (req, res, next) => {
  if (!req.user?.doctorProfile && req.user?.role === 'DOCTOR') {
    req.user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { doctorProfile: true, adminProfile: true, receptionistProfile: true },
    });
  }

  if (!req.user?.doctorProfile) return sendError(res, 'Doctor profile not found', 404);
  if (req.user.doctorProfile.approvalStatus !== 'VERIFIED') {
    return sendError(res, 'Doctor profile is pending verification', 403);
  }
  next();
};

const requireAdminLevel = (...levels) => (req, res, next) => {
  if (!req.user?.adminProfile) return sendError(res, 'Admin access required', 403);
  if (!levels.includes(req.user.adminProfile.level)) {
    return sendError(res, 'Insufficient admin permissions', 403);
  }
  next();
};

const requireClinicAccess = async (req, res, next) => {
  try {
    const clinicId = req.params.clinicId || req.params.id || req.body.clinicId || req.query.clinicId;
    if (!clinicId) return sendError(res, 'Clinic ID is required', 400);

    if (req.user.role === 'SUPER_ADMIN') return next();

    const staffRecord = await prisma.clinicStaff.findFirst({
      where: { clinicId, userId: req.user.id, isActive: true },
    });

    if (!staffRecord) return sendError(res, 'You do not have access to this clinic', 403);
    req.clinicStaff = staffRecord;
    next();
  } catch (error) {
    return sendError(res, 'Authorization check failed', 500);
  }
};

module.exports = {
  authenticate,
  authorize: requireRole,
  requireRole,
  requireApprovalStatuses,
  requireClinicVerified,
  requireDoctorVerified,
  requireAdminLevel,
  requireClinicAccess,
};
