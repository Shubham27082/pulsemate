const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');

const listMarketplaceDoctors = async (req, res, next) => {
  try {
    const { specialization, city, experienceYears } = req.query;
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'VERIFIED',
        marketplaceVisible: true,
        ...(specialization ? { specialization: { contains: specialization, mode: 'insensitive' } } : {}),
        ...(experienceYears ? { experienceYears: { gte: Number(experienceYears) } } : {}),
        ...(city
          ? {
              doctorClinics: {
                some: {
                  inviteStatus: 'ACCEPTED',
                  clinic: { city: { contains: city, mode: 'insensitive' } },
                },
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, mobile: true, email: true } },
        doctorClinics: {
          where: { inviteStatus: 'ACCEPTED', removedAt: null },
          include: { clinic: { select: { id: true, name: true, city: true } } },
        },
      },
      orderBy: [{ experienceYears: 'desc' }, { createdAt: 'desc' }],
    });

    return sendSuccess(res, { doctors });
  } catch (error) {
    next(error);
  }
};

const inviteDoctorToClinic = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { clinicId, consultationFee, workingDays, workingStartTime, workingEndTime } = req.body;

    const clinic = await prisma.clinic.findFirst({
      where: { id: clinicId, ownerId: req.user.id, approvalStatus: 'VERIFIED' },
    });
    if (!clinic) return sendError(res, 'Clinic not found or not verified', 404);

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });
    if (!doctor || doctor.approvalStatus !== 'VERIFIED') {
      return sendError(res, 'Doctor is not available in marketplace', 400);
    }

    const invite = await prisma.doctorClinic.upsert({
      where: { doctorId_clinicId: { doctorId, clinicId } },
      update: {
        inviteStatus: 'PENDING',
        removedAt: null,
        isActive: true,
        consultationFee: consultationFee ?? doctor.consultationFee,
        availableDays: workingDays || [],
        startTime: workingStartTime || null,
        endTime: workingEndTime || null,
      },
      create: {
        doctorId,
        clinicId,
        inviteStatus: 'PENDING',
        consultationFee: consultationFee ?? doctor.consultationFee,
        availableDays: workingDays || [],
        startTime: workingStartTime || null,
        endTime: workingEndTime || null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_INVITED_TO_CLINIC',
      entityType: 'ClinicDoctor',
      entityId: invite.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { invite }, 'Doctor invitation sent successfully', 201);
  } catch (error) {
    next(error);
  }
};

const listMyInvitations = async (req, res, next) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return sendError(res, 'Doctor profile not found', 404);

    const invites = await prisma.doctorClinic.findMany({
      where: { doctorId: doctor.id, removedAt: null },
      include: { clinic: true },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { invitations: invites });
  } catch (error) {
    next(error);
  }
};

const respondToInvitation = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const { action } = req.body;
    if (!['ACCEPT', 'REJECT', 'LEAVE'].includes(action)) {
      return sendError(res, 'Invalid invitation action', 400);
    }

    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return sendError(res, 'Doctor profile not found', 404);

    const invite = await prisma.doctorClinic.findFirst({
      where: { id: inviteId, doctorId: doctor.id },
    });
    if (!invite) return sendError(res, 'Invitation not found', 404);

    let updateData;
    if (action === 'ACCEPT') {
      updateData = { inviteStatus: 'ACCEPTED', joinedAt: new Date(), removedAt: null, isActive: true };
    } else if (action === 'REJECT') {
      updateData = { inviteStatus: 'REJECTED', isActive: false };
    } else {
      updateData = { inviteStatus: 'REMOVED', removedAt: new Date(), isActive: false };
    }

    const updated = await prisma.doctorClinic.update({
      where: { id: inviteId },
      data: updateData,
      include: { clinic: true },
    });

    await createAuditLog({
      userId: req.user.id,
      action: `DOCTOR_INVITATION_${action}`,
      entityType: 'ClinicDoctor',
      entityId: inviteId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { invitation: updated }, `Invitation ${action.toLowerCase()}ed successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMarketplaceDoctors,
  inviteDoctorToClinic,
  listMyInvitations,
  respondToInvitation,
};
