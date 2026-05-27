const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { hashValue } = require('../utils/crypto');

/**
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalClinics,
      verifiedClinics,
      pendingClinics,
      pendingDoctors,
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.clinic.count(),
      prisma.clinic.count({ where: { isVerified: true } }),
      prisma.clinic.count({ where: { isVerified: false } }),
      prisma.user.count({ where: { role: 'DOCTOR', approvalStatus: 'PENDING' } }),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return sendSuccess(res, {
      stats: {
        totalUsers,
        totalClinics,
        verifiedClinics,
        pendingClinics,
        pendingDoctors,
        totalDoctors,
        totalPatients,
        totalAppointments,
        todayAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/clinics
 */
const getClinics = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, verified, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (verified !== undefined) where.isVerified = verified === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          owner: { select: { id: true, name: true, mobile: true, email: true } },
          _count: { select: { staff: true, appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clinic.count({ where }),
    ]);

    return sendPaginated(res, clinics, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/clinics/:id/approve
 */
const approveClinic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const clinic = await prisma.clinic.update({
      where: { id },
      data: { isVerified: approved !== false },
    });

    await createAuditLog({
      userId: req.user.id,
      action: approved !== false ? 'CLINIC_APPROVED' : 'CLINIC_REJECTED',
      entityType: 'Clinic',
      entityId: id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { clinic }, `Clinic ${approved !== false ? 'approved' : 'rejected'} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
          role: true,
          isActive: true,
          approvalStatus: true,
          rejectionReason: true,
          createdAt: true,
          adminProfile: {
            select: { level: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return sendPaginated(res, users, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user.id) {
      return sendError(res, 'Cannot modify your own account status', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, mobile: true, role: true, isActive: true },
    });

    await createAuditLog({
      userId: req.user.id,
      action: isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      entityType: 'User',
      entityId: id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user }, `User ${isActive ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users - Create staff user
 */
const createStaffUser = async (req, res, next) => {
  try {
    const { name, mobile, email, role, password } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile }, ...(email ? [{ email }] : [])] },
    });

    if (existing) {
      return sendError(res, 'User with this mobile or email already exists', 409);
    }

    const passwordHash = password ? await hashValue(password) : null;

    const user = await prisma.user.create({
      data: { name, mobile, email, role, passwordHash },
      select: { id: true, name: true, mobile: true, email: true, role: true, isActive: true },
    });

    return sendSuccess(res, { user }, 'Staff user created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getClinics, approveClinic, getUsers, updateUserStatus, createStaffUser };
