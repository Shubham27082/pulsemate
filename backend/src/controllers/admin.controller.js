const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { hashPassword } = require('../utils/hash');

const ROOT_ADMIN_LEVEL = 'ROOT';
const MANAGEABLE_ADMIN_LEVELS = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'];

const isRootAdmin = (user) => user?.adminProfile?.level === ROOT_ADMIN_LEVEL;
const isAdminUser = (user) => user?.role === 'SUPER_ADMIN' && !!user?.adminProfile;

const getDashboard = async (req, res, next) => {
  try {
    const clinicReviewStatuses = ['PENDING', 'UNDER_REVIEW'];
    const doctorReviewStatuses = ['PENDING', 'UNDER_REVIEW'];
    const [
      totalUsers,
      pendingClinics,
      pendingDoctors,
      verifiedClinics,
      verifiedDoctors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.clinic.count({ where: { approvalStatus: { in: clinicReviewStatuses } } }),
      prisma.doctorProfile.count({ where: { approvalStatus: { in: doctorReviewStatuses } } }),
      prisma.clinic.count({ where: { approvalStatus: 'VERIFIED' } }),
      prisma.doctorProfile.count({ where: { approvalStatus: 'VERIFIED' } }),
    ]);

    return sendSuccess(res, {
      stats: {
        totalUsers,
        pendingClinics,
        pendingDoctors,
        verifiedClinics,
        verifiedDoctors,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPendingClinics = async (req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { approvalStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, { clinics }, 'Pending clinics fetched');
  } catch (error) {
    next(error);
  }
};

const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: { approvalStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, { doctors }, 'Pending doctors fetched');
  } catch (error) {
    next(error);
  }
};

const approveClinic = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const verifiedClinic = await tx.clinic.update({
        where: { id: clinicId },
        data: {
          approvalStatus: 'VERIFIED',
          isVerified: true,
          rejectionReason: null,
          verifiedAt: new Date(),
          verifiedById: req.user.id,
        },
      });

      const owner = await tx.user.update({
        where: { id: clinic.ownerId },
        data: {
          approvalStatus: 'VERIFIED',
          rejectionReason: null,
        },
      });

      return { clinic: verifiedClinic, owner };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_APPROVED',
      entityType: 'Clinic',
      entityId: clinicId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Clinic approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectClinic = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { rejectionReason } = req.body;

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const rejectedClinic = await tx.clinic.update({
        where: { id: clinicId },
        data: {
          approvalStatus: 'REJECTED',
          isVerified: false,
          rejectionReason: rejectionReason || 'Clinic registration rejected',
          verifiedAt: null,
          verifiedById: null,
        },
      });

      const owner = await tx.user.update({
        where: { id: clinic.ownerId },
        data: {
          approvalStatus: 'REJECTED',
          rejectionReason: rejectionReason || 'Clinic registration rejected',
        },
      });

      return { clinic: rejectedClinic, owner };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_REJECTED',
      entityType: 'Clinic',
      entityId: clinicId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Clinic rejected successfully');
  } catch (error) {
    next(error);
  }
};

const approveDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const profile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!profile) return sendError(res, 'Doctor profile not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const doctorProfile = await tx.doctorProfile.update({
        where: { id: doctorId },
        data: {
          approvalStatus: 'VERIFIED',
          marketplaceVisible: true,
        },
      });

      const user = await tx.user.update({
        where: { id: profile.userId },
        data: {
          approvalStatus: 'VERIFIED',
          rejectionReason: null,
        },
      });

      return { doctorProfile, user };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_APPROVED',
      entityType: 'DoctorProfile',
      entityId: doctorId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Doctor approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { rejectionReason } = req.body;

    const profile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!profile) return sendError(res, 'Doctor profile not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const doctorProfile = await tx.doctorProfile.update({
        where: { id: doctorId },
        data: {
          approvalStatus: 'REJECTED',
          marketplaceVisible: false,
        },
      });

      const user = await tx.user.update({
        where: { id: profile.userId },
        data: {
          approvalStatus: 'REJECTED',
          rejectionReason: rejectionReason || 'Doctor profile rejected',
        },
      });

      return { doctorProfile, user };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_REJECTED',
      entityType: 'DoctorProfile',
      entityId: doctorId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Doctor rejected successfully');
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

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
        skip,
        take: Number(limit),
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

    return res.status(200).json({
      success: true,
      message: 'Users fetched',
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user.id) {
      return sendError(res, 'Cannot modify your own account status', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
      },
    });

    if (!targetUser) {
      return sendError(res, 'User not found', 404);
    }

    if (isAdminUser(targetUser)) {
      if (!isRootAdmin(req.user)) {
        return sendError(res, 'Only the root admin can change admin account status', 403);
      }
      if (targetUser.adminProfile.level === ROOT_ADMIN_LEVEL) {
        return sendError(res, 'Root admin account status cannot be changed', 400);
      }
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
      metadata: { targetRole: targetUser.role, targetAdminLevel: targetUser.adminProfile?.level || null },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user }, `User ${isActive ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    next(error);
  }
};

const createAdminAccount = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, level } = req.body;

    if (!MANAGEABLE_ADMIN_LEVELS.includes(level)) {
      return sendError(res, 'Invalid admin level', 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ mobile: phone }, { email: email.toLowerCase() }],
      },
    });

    if (existing) {
      return sendError(res, 'User with this phone or email already exists', 409);
    }

    const admin = await prisma.user.create({
      data: {
        name: fullName,
        mobile: phone,
        email: email.toLowerCase(),
        role: 'SUPER_ADMIN',
        approvalStatus: 'VERIFIED',
        isPhoneVerified: true,
        isEmailVerified: true,
        isActive: true,
        passwordHash: await hashPassword(password),
        adminProfile: {
          create: {
            level,
            createdById: req.user.id,
          },
        },
      },
      include: {
        adminProfile: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_CREATED',
      entityType: 'User',
      entityId: admin.id,
      metadata: { level },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
          isActive: admin.isActive,
          approvalStatus: admin.approvalStatus,
          adminProfile: { level: admin.adminProfile.level },
        },
      },
      'Admin account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

const deleteAdminAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return sendError(res, 'You cannot delete your own root admin account', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
      },
    });

    if (!targetUser || !isAdminUser(targetUser)) {
      return sendError(res, 'Admin account not found', 404);
    }

    if (targetUser.adminProfile.level === ROOT_ADMIN_LEVEL) {
      return sendError(res, 'Root admin account cannot be deleted', 400);
    }

    await prisma.user.delete({
      where: { id },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_DELETED',
      entityType: 'User',
      entityId: id,
      metadata: {
        deletedEmail: targetUser.email,
        deletedLevel: targetUser.adminProfile.level,
      },
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'Admin account deleted successfully');
  } catch (error) {
    next(error);
  }
};

const resetDatabase = async (req, res, next) => {
  try {
    const triggeredBy = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    };

    const adminPasswordHash = await hashPassword('Nkabu18$');

    const adminUser = await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany();
      await tx.fcmToken.deleteMany();
      await tx.payment.deleteMany();
      await tx.prescription.deleteMany();
      await tx.queueItem.deleteMany();
      await tx.queue.deleteMany();
      await tx.appointment.deleteMany();
      await tx.doctorClinic.deleteMany();
      await tx.clinicStaff.deleteMany();
      await tx.receptionistProfile.deleteMany();
      await tx.adminProfile.deleteMany();
      await tx.doctorProfile.deleteMany();
      await tx.patientProfile.deleteMany();
      await tx.passwordResetToken.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.session.deleteMany();
      await tx.otpVerification.deleteMany();
      await tx.clinic.deleteMany();
      await tx.user.deleteMany();

      const createdAdmin = await tx.user.create({
        data: {
          name: 'Sahil Naik',
          mobile: '+919000000001',
          email: 'sahilnaik1515@gmail.com',
          role: 'SUPER_ADMIN',
          approvalStatus: 'VERIFIED',
          passwordHash: adminPasswordHash,
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          adminProfile: {
            create: {
              level: ROOT_ADMIN_LEVEL,
            },
          },
        },
        include: {
          adminProfile: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: createdAdmin.id,
          action: 'DATABASE_RESET',
          entityType: 'System',
          metadata: {
            triggeredBy,
            resetAt: new Date().toISOString(),
            bootstrapAdminEmail: createdAdmin.email,
          },
          ipAddress: req.ip,
        },
      });

      return createdAdmin;
    });

    return sendSuccess(
      res,
      {
        admin: {
          email: adminUser.email,
          password: 'Nkabu18$',
        },
      },
      'Database reset successfully. Sign in again with the recreated admin account.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getPendingClinics,
  getPendingDoctors,
  approveClinic,
  rejectClinic,
  approveDoctor,
  rejectDoctor,
  getUsers,
  updateUserStatus,
  createAdminAccount,
  deleteAdminAccount,
  resetDatabase,
};
