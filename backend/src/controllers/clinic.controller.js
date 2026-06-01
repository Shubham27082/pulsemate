const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { hashValue } = require('../utils/crypto');

/**
 * POST /api/clinics - Create clinic
 */
const createClinic = async (req, res, next) => {
  try {
    const { name, phone, address, city, latitude, longitude, openingTime, closingTime, description } = req.body;

    const clinic = await prisma.clinic.create({
      data: {
        name,
        phone,
        address,
        city,
        latitude,
        longitude,
        openingTime,
        closingTime,
        description,
        ownerId: req.user.id,
        staff: {
          create: {
            userId: req.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    // Update user role to CLINIC_OWNER if not already
    if (req.user.role !== 'CLINIC_OWNER' && req.user.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'CLINIC_OWNER' },
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_CREATED',
      entityType: 'Clinic',
      entityId: clinic.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { clinic }, 'Clinic created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/my - Get owner's clinics
 */
const getMyClinics = async (req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: { select: { staff: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { clinics });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/:id - Get clinic details
 */
const getClinic = async (req, res, next) => {
  try {
    const { id } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, mobile: true, email: true } },
        staff: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, mobile: true, email: true, role: true },
              include: { doctorProfile: true },
            },
          },
        },
        doctorClinics: {
          where: { isActive: true },
          include: {
            doctor: {
              include: {
                user: { select: { id: true, name: true, mobile: true } },
              },
            },
          },
        },
      },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found', 404);
    }

    return sendSuccess(res, { clinic });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clinics/:id - Update clinic
 */
const updateClinic = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.clinic.findFirst({
      where: { id, ownerId: req.user.role === 'SUPER_ADMIN' ? undefined : req.user.id },
    });

    if (!existing) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    const clinic = await prisma.clinic.update({
      where: { id },
      data: req.body,
    });

    return sendSuccess(res, { clinic }, 'Clinic updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clinics/:id/staff - Add staff to clinic
 */
const addStaff = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;
    const { mobile, role, name, email, password } = req.body;

    // Verify clinic ownership
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        ownerId: req.user.role === 'SUPER_ADMIN' ? undefined : req.user.id,
      },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      const staffRole = role === 'DOCTOR' ? 'DOCTOR' : 'RECEPTIONIST';
      const passwordHash = password ? await hashValue(password) : null;

      user = await prisma.user.create({
        data: {
          mobile,
          name,
          email,
          role: staffRole,
          approvalStatus: 'VERIFIED',
          passwordHash,
          ...(role === 'DOCTOR' && {
            doctorProfile: {
              create: {
                approvalStatus: 'VERIFIED',
                marketplaceVisible: false,
              },
            },
          }),
          ...(role === 'RECEPTIONIST' && {
            receptionistProfile: {
              create: {
                assignedClinicId: clinicId,
                createdByOwnerId: req.user.id,
              },
            },
          }),
        },
      });
    } else {
      // Update role if needed
      const targetRole = role === 'DOCTOR' ? 'DOCTOR' : 'RECEPTIONIST';
      if (user.role === 'PATIENT') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: targetRole },
        });
        if (role === 'DOCTOR' && !await prisma.doctorProfile.findUnique({ where: { userId: user.id } })) {
          await prisma.doctorProfile.create({
            data: {
              userId: user.id,
              approvalStatus: 'VERIFIED',
              marketplaceVisible: false,
            },
          });
        }
        if (role === 'RECEPTIONIST' && !await prisma.receptionistProfile.findUnique({ where: { userId: user.id } })) {
          await prisma.receptionistProfile.create({
            data: {
              userId: user.id,
              assignedClinicId: clinicId,
              createdByOwnerId: req.user.id,
            },
          });
        }
      }
    }

    // Check if already staff
    const existingStaff = await prisma.clinicStaff.findUnique({
      where: { clinicId_userId: { clinicId, userId: user.id } },
    });

    if (existingStaff) {
      if (existingStaff.isActive) {
        return sendError(res, 'User is already a staff member of this clinic', 409);
      }
      // Reactivate
      await prisma.clinicStaff.update({
        where: { id: existingStaff.id },
        data: { isActive: true, role },
      });
    } else {
      await prisma.clinicStaff.create({
        data: { clinicId, userId: user.id, role },
      });
    }

    // If doctor, create DoctorClinic link
    if (role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (doctorProfile) {
        await prisma.doctorClinic.upsert({
          where: { doctorId_clinicId: { doctorId: doctorProfile.id, clinicId } },
          update: { isActive: true, inviteStatus: 'ACCEPTED', joinedAt: new Date(), removedAt: null },
          create: { doctorId: doctorProfile.id, clinicId, inviteStatus: 'ACCEPTED', joinedAt: new Date() },
        });
      }
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'STAFF_ADDED',
      entityType: 'ClinicStaff',
      entityId: clinicId,
      metadata: { staffUserId: user.id, role },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: { id: user.id, name: user.name, mobile: user.mobile, role } }, 'Staff added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/:id/staff - Get clinic staff
 */
const getStaff = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;

    const staff = await prisma.clinicStaff.findMany({
      where: { clinicId, isActive: true },
      include: {
        user: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });

    return sendSuccess(res, { staff });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/:id/doctor-invites - Get doctor invite history for a clinic
 */
const getDoctorInvites = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;

    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({
        where: { id: clinicId, ownerId: req.user.id },
      });
      if (!clinic) return sendError(res, 'Clinic not found or access denied', 404);
    }

    const invites = await prisma.doctorClinic.findMany({
      where: { clinicId },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, mobile: true, email: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return sendSuccess(res, { invites });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clinics/:id/staff/:staffId/status - Update staff status
 */
const updateStaffStatus = async (req, res, next) => {
  try {
    const { id: clinicId, staffId } = req.params;
    const { isActive } = req.body;

    const staffRecord = await prisma.clinicStaff.findFirst({
      where: { id: staffId, clinicId },
    });

    if (!staffRecord) {
      return sendError(res, 'Staff record not found', 404);
    }

    await prisma.clinicStaff.update({
      where: { id: staffId },
      data: { isActive },
    });

    return sendSuccess(res, {}, `Staff ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

const getClinicRevenue = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;
    const { period = 'today' } = req.query;

    // Verify access
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) return sendError(res, 'Access denied', 403);
    }

    // Date range
    const now = new Date();
    let startDate, endDate;

    if (period === 'today') {
      startDate = new Date(); startDate.setUTCHours(0, 0, 0, 0);
      endDate   = new Date(); endDate.setUTCHours(23, 59, 59, 999);
    } else if (period === 'week') {
      startDate = new Date(); startDate.setDate(now.getDate() - 6); startDate.setUTCHours(0, 0, 0, 0);
      endDate   = new Date(); endDate.setUTCHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); startDate.setUTCHours(0, 0, 0, 0);
      endDate   = new Date(); endDate.setUTCHours(23, 59, 59, 999);
    } else {
      startDate = new Date(0);
      endDate   = new Date();
    }

    // All paid payments for this clinic in range
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: startDate, lte: endDate },
        appointment: { clinicId },
      },
      include: {
        appointment: {
          select: {
            id: true, slotTime: true, appointmentDate: true,
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
        patient: { select: { id: true, name: true, mobile: true } },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const cashRevenue  = payments.filter((p) => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const onlineRevenue = payments.filter((p) => p.method !== 'CASH').reduce((sum, p) => sum + p.amount, 0);

    // Revenue by doctor
    const byDoctor = {};
    for (const p of payments) {
      const name = p.appointment?.doctor?.user?.name || 'Unknown';
      if (!byDoctor[name]) byDoctor[name] = 0;
      byDoctor[name] += p.amount;
    }

    // Today's appointment count
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);
    const [totalAppointments, completedToday, pendingPayments] = await Promise.all([
      prisma.appointment.count({ where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { clinicId, status: 'COMPLETED', appointmentDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.payment.count({ where: { status: 'PENDING', appointment: { clinicId } } }),
    ]);

    return sendSuccess(res, {
      period,
      totalRevenue,
      cashRevenue,
      onlineRevenue,
      transactionCount: payments.length,
      revenueByDoctor: Object.entries(byDoctor).map(([doctor, amount]) => ({ doctor, amount })),
      recentPayments: payments.slice(0, 10),
      stats: { totalAppointments, completedToday, pendingPayments },
    });
  } catch (error) {
    next(error);
  }
};


const getClinicAppointments = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;
    const { date, status, doctorId, page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    // Verify access: owner or super admin
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) {
        // Also allow receptionist/doctor of this clinic
        const staff = await prisma.clinicStaff.findFirst({
          where: { clinicId, userId: req.user.id, isActive: true },
        });
        if (!staff) return sendError(res, 'Access denied', 403);
      }
    }

    const where = { clinicId };
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (date) {
      const d = new Date(date);
      where.appointmentDate = {
        gte: new Date(new Date(d).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(d).setUTCHours(23, 59, 59, 999)),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          patient: { select: { id: true, name: true, mobile: true } },
          doctor: { include: { user: { select: { id: true, name: true } } } },
          queueItem: { select: { id: true, status: true, position: true } },
        },
        orderBy: [{ appointmentDate: 'desc' }, { queueNumber: 'asc' }],
      }),
      prisma.appointment.count({ where }),
    ]);

    return sendPaginated(res, appointments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClinic,
  getMyClinics,
  getClinic,
  updateClinic,
  addStaff,
  getStaff,
  getDoctorInvites,
  updateStaffStatus,
  getClinicRevenue,
  getClinicAppointments,
};
