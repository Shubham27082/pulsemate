const prisma = require('../config/database');
const { verifyAccessToken } = require('../services/token.service');
const { sendError } = require('../utils/response');

const includeUserProfile = {
  adminProfile: true,
  doctorProfile: true,
  receptionistProfile: {
    include: {
      assignedClinic: true,
    },
  },
  ownedClinics: true,
};

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: includeUserProfile,
    });

    if (!user) return sendError(res, 'Authentication required', 401);
    if (!user.isActive) return sendError(res, 'Account is disabled', 403);
    if (user.approvalStatus === 'SUSPENDED') {
      return sendError(res, user.suspendedReason || 'Account is suspended', 403);
    }
    if (user.approvalStatus === 'REJECTED') {
      return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
    }

    req.user = user;
    req.auth = decoded;
    next();
  } catch (error) {
    return sendError(res, error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token', 401);
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  if (!roles.includes(req.user.role)) {
    return sendError(res, 'You do not have permission to perform this action', 403);
  }
  next();
};

const requireVerifiedAccount = (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  if (req.user.approvalStatus !== 'VERIFIED') {
    return sendError(res, 'Your account is pending verification', 403);
  }
  next();
};

const requireVerifiedClinic = async (req, res, next) => {
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
    return sendError(res, 'Clinic verification is pending', 403);
  }

  req.clinic = clinic;
  next();
};

const requireClinicOwner = authorizeRoles('CLINIC_OWNER');
const requireDoctor = authorizeRoles('DOCTOR');
const requireReceptionist = authorizeRoles('RECEPTIONIST');
const requireSuperAdmin = authorizeRoles('SUPER_ADMIN');

const requireVerifiedDoctor = async (req, res, next) => {
  if (!req.user?.doctorProfile) {
    return sendError(res, 'Doctor profile not found', 404);
  }

  if (req.user.doctorProfile.approvalStatus !== 'VERIFIED') {
    return sendError(res, 'Doctor profile verification is pending', 403);
  }

  next();
};

const requireClinicAccess = async (req, res, next) => {
  const clinicId = req.params.clinicId || req.params.id || req.body.clinicId || req.query.clinicId;
  if (!clinicId) return sendError(res, 'Clinic ID is required', 400);
  if (req.user.role === 'SUPER_ADMIN') return next();

  if (req.user.role === 'CLINIC_OWNER') {
    const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
    if (!clinic) return sendError(res, 'You do not have access to this clinic', 403);
    req.clinic = clinic;
    return next();
  }

  const staff = await prisma.clinicStaff.findFirst({
    where: { clinicId, userId: req.user.id, isActive: true },
  });
  if (!staff) return sendError(res, 'You do not have access to this clinic', 403);

  req.clinicStaff = staff;
  next();
};

const requireApprovalStatuses = (...statuses) => (req, res, next) => {
  if (!statuses.includes(req.user?.approvalStatus)) {
    return sendError(res, `Account status ${req.user?.approvalStatus} is not allowed for this action`, 403);
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

module.exports = {
  authenticateUser,
  authenticate: authenticateUser,
  authorizeRoles,
  authorize: authorizeRoles,
  requireRole: authorizeRoles,
  requireVerifiedAccount,
  requireVerifiedClinic,
  requireClinicVerified: requireVerifiedClinic,
  requireClinicOwner,
  requireDoctor,
  requireReceptionist,
  requireSuperAdmin,
  requireVerifiedDoctor,
  requireDoctorVerified: requireVerifiedDoctor,
  requireClinicAccess,
  requireApprovalStatuses,
  requireAdminLevel,
};
