const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');

const listPendingClinics = async (req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { approvalStatus: 'PENDING' },
      include: { owner: { include: { adminProfile: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return sendSuccess(res, { clinics });
  } catch (error) {
    next(error);
  }
};

const listPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', approvalStatus: 'PENDING' },
      include: { doctorProfile: true },
      orderBy: { createdAt: 'asc' },
    });
    return sendSuccess(res, { doctors });
  } catch (error) {
    next(error);
  }
};

const decideClinicApproval = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { status, reason } = req.body;
    if (!['VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const nextClinic = await tx.clinic.update({
        where: { id: clinicId },
        data: {
          isVerified: status === 'VERIFIED',
          approvalStatus: status,
          rejectionReason: status === 'VERIFIED' ? null : reason || null,
        },
      });

      await tx.user.update({
        where: { id: clinic.ownerId },
        data: {
          approvalStatus: status,
          rejectionReason: status === 'VERIFIED' ? null : reason || null,
          suspendedReason: status === 'SUSPENDED' ? reason || null : null,
        },
      });

      return nextClinic;
    });

    await createAuditLog({
      userId: req.user.id,
      action: `CLINIC_${status}`,
      entityType: 'Clinic',
      entityId: clinicId,
      metadata: { reason: reason || null },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { clinic: updated }, `Clinic marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

const decideDoctorApproval = async (req, res, next) => {
  try {
    const { doctorUserId } = req.params;
    const { status, reason } = req.body;
    if (!['VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const doctor = await prisma.user.findFirst({
      where: { id: doctorUserId, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });
    if (!doctor?.doctorProfile) return sendError(res, 'Doctor not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: doctorUserId },
        data: {
          approvalStatus: status,
          rejectionReason: status === 'VERIFIED' ? null : reason || null,
          suspendedReason: status === 'SUSPENDED' ? reason || null : null,
        },
        include: { doctorProfile: true },
      });

      await tx.doctorProfile.update({
        where: { id: doctor.doctorProfile.id },
        data: {
          approvalStatus: status,
          marketplaceVisible: status === 'VERIFIED',
        },
      });

      return nextUser;
    });

    await createAuditLog({
      userId: req.user.id,
      action: `DOCTOR_${status}`,
      entityType: 'User',
      entityId: doctorUserId,
      metadata: { reason: reason || null },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: updated }, `Doctor marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPendingClinics,
  listPendingDoctors,
  decideClinicApproval,
  decideDoctorApproval,
};
