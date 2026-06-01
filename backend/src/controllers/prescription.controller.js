const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { notifyFollowUpReminder } = require('../services/notification.service');

/**
 * POST /api/prescriptions - Doctor creates a prescription for a completed appointment
 */
const createPrescription = async (req, res, next) => {
  try {
    const {
      appointmentId,
      diagnosis,
      medicines,       // [{ name, dosage, frequency, duration, notes }]
      instructions,
      followUpDate,
      requiresFollowUp,
    } = req.body;

    // Verify doctor owns this appointment
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId: doctorProfile.id },
      include: {
        patient: { select: { id: true, name: true } },
        prescription: true,
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (appointment.prescription) {
      return sendError(res, 'Prescription already exists for this appointment', 409);
    }

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        doctorId: doctorProfile.id,
        patientId: appointment.patientId,
        diagnosis: diagnosis || null,
        medicines: medicines || [],
        instructions: instructions || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        requiresFollowUp: requiresFollowUp || false,
      },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        patient: { select: { id: true, name: true } },
        appointment: { select: { id: true, appointmentDate: true, clinicId: true } },
      },
    });

    // Send follow-up reminder notification if needed
    if (requiresFollowUp && followUpDate) {
      const doctorName = prescription.doctor.user.name || 'your doctor';
      await notifyFollowUpReminder(appointment.patientId, doctorName, followUpDate);
    }

    return sendSuccess(res, { prescription }, 'Prescription created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/prescriptions/:id - Get a single prescription
 * Accessible by: the patient, the doctor, clinic staff
 */
const getPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        patient: { select: { id: true, name: true, mobile: true } },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentType: true,
            symptoms: true,
            clinic: { select: { id: true, name: true, address: true, city: true } },
          },
        },
      },
    });

    if (!prescription) {
      return sendError(res, 'Prescription not found', 404);
    }

    // Access control: patient can only see their own
    if (req.user.role === 'PATIENT' && prescription.patientId !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    // Doctor can see prescriptions for their own patients OR their own prescriptions
    if (req.user.role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      // Allow if they wrote it OR if they are the patient (doctor booking as patient)
      if (prescription.doctorId !== doctorProfile?.id && prescription.patientId !== req.user.id) {
        return sendError(res, 'Access denied', 403);
      }
    }

    return sendSuccess(res, { prescription });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/prescriptions/appointment/:appointmentId - Get prescription by appointment
 */
const getPrescriptionByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { appointmentId },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        patient: { select: { id: true, name: true, mobile: true } },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentType: true,
            symptoms: true,
            clinic: { select: { id: true, name: true, address: true, city: true } },
          },
        },
      },
    });

    if (!prescription) {
      return sendError(res, 'No prescription found for this appointment', 404);
    }

    // Access control
    if (req.user.role === 'PATIENT' && prescription.patientId !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, { prescription });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/prescriptions/my - Patient gets all their prescriptions
 */
const getMyPrescriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // For DOCTOR role acting as patient, query by patientId = req.user.id
    // This works because when a doctor books as a patient, patientId = their userId
    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: { patientId: req.user.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { include: { user: { select: { id: true, name: true } } } },
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              clinic: { select: { id: true, name: true, city: true } },
            },
          },
        },
      }),
      prisma.prescription.count({ where: { patientId: req.user.id } }),
    ]);

    return sendSuccess(res, { prescriptions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/prescriptions/:id - Doctor updates a prescription
 */
const updatePrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis, medicines, instructions, followUpDate, requiresFollowUp } = req.body;

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });

    const prescription = await prisma.prescription.findFirst({
      where: { id, doctorId: doctorProfile?.id },
    });

    if (!prescription) {
      return sendError(res, 'Prescription not found or access denied', 404);
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        ...(diagnosis !== undefined && { diagnosis }),
        ...(medicines !== undefined && { medicines }),
        ...(instructions !== undefined && { instructions }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(requiresFollowUp !== undefined && { requiresFollowUp }),
      },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        patient: { select: { id: true, name: true } },
      },
    });

    return sendSuccess(res, { prescription: updated }, 'Prescription updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescription,
  getPrescriptionByAppointment,
  getMyPrescriptions,
  updatePrescription,
};
