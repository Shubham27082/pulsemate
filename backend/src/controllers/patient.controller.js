const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { notifyAppointmentBooked } = require('../services/notification.service');

/**
 * GET /api/patient/doctors - Search doctors
 */
const searchDoctors = async (req, res, next) => {
  try {
    const { specialization, city, name, available, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      user: { isActive: true, role: 'DOCTOR' },
    };

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (available === 'true') {
      where.offlineAvailable = true;
    }

    if (name) {
      where.user = {
        ...where.user,
        name: { contains: name, mode: 'insensitive' },
      };
    }

    const doctorWhere = { ...where };

    if (city) {
      doctorWhere.doctorClinics = {
        some: {
          isActive: true,
          clinic: { city: { contains: city, mode: 'insensitive' }, isVerified: true },
        },
      };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where: doctorWhere,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, mobile: true } },
          doctorClinics: {
            where: { isActive: true },
            include: {
              clinic: { select: { id: true, name: true, city: true, address: true, isVerified: true } },
            },
          },
        },
      }),
      prisma.doctorProfile.count({ where: doctorWhere }),
    ]);

    return sendPaginated(res, doctors, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/doctors/:id - Get doctor profile
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, mobile: true } },
        doctorClinics: {
          where: { isActive: true },
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                phone: true,
                openingTime: true,
                closingTime: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      return sendError(res, 'Doctor not found', 404);
    }

    return sendSuccess(res, { doctor });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patient/appointments - Book appointment
 */
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, clinicId, appointmentType, appointmentDate, slotTime, symptoms } = req.body;

    // Verify doctor-clinic relationship
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId, clinicId, isActive: true },
      include: { doctor: true },
    });

    if (!doctorClinic) {
      return sendError(res, 'Doctor is not available at this clinic', 400);
    }

    // Check for duplicate booking on same date
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        patientId: req.user.id,
        doctorId,
        clinicId,
        appointmentDate: {
          gte: new Date(new Date(appointmentDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(appointmentDate).setHours(23, 59, 59, 999)),
        },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    if (existingBooking) {
      return sendError(res, 'You already have an appointment with this doctor on this date', 409);
    }

    let queueNumber = null;
    let estimatedWaitMinutes = null;

    // For offline appointments, assign queue number
    if (appointmentType === 'OFFLINE') {
      const today = new Date(appointmentDate);
      today.setHours(0, 0, 0, 0);

      // Get or create queue
      let queue = await prisma.queue.findFirst({
        where: { clinicId, doctorId, date: today },
      });

      if (!queue) {
        queue = await prisma.queue.create({
          data: { clinicId, doctorId, date: today, status: 'ACTIVE' },
        });
      }

      const lastItem = await prisma.queueItem.findFirst({
        where: { queueId: queue.id },
        orderBy: { queueNumber: 'desc' },
      });

      queueNumber = (lastItem?.queueNumber || 0) + 1;

      const waitingCount = await prisma.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' },
      });

      estimatedWaitMinutes = (waitingCount + 1) * (doctorClinic.avgConsultationMins || 10);
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user.id,
        doctorId,
        clinicId,
        appointmentType,
        appointmentDate: new Date(appointmentDate),
        slotTime,
        symptoms,
        status: 'BOOKED',
        queueNumber,
        estimatedWaitMinutes,
      },
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true, address: true, city: true } },
      },
    });

    // Create queue item for offline appointments
    if (appointmentType === 'OFFLINE' && queueNumber) {
      const today = new Date(appointmentDate);
      today.setHours(0, 0, 0, 0);

      const queue = await prisma.queue.findFirst({
        where: { clinicId, doctorId, date: today },
      });

      if (queue) {
        const waitingCount = await prisma.queueItem.count({
          where: { queueId: queue.id, status: 'WAITING' },
        });

        await prisma.queueItem.create({
          data: {
            queueId: queue.id,
            appointmentId: appointment.id,
            patientId: req.user.id,
            queueNumber,
            status: 'WAITING',
            position: waitingCount + 1,
          },
        });
      }
    }

    return sendSuccess(res, { appointment }, 'Appointment booked successfully', 201);

    // Send booking confirmation notification (fire-and-forget)
    const doctorName = appointment.doctor?.user?.name || 'the doctor';
    notifyAppointmentBooked(req.user.id, doctorName, appointmentDate, queueNumber).catch(() => {});
  } catch (error) {
    next(error);
  }
};
const getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { patientId: req.user.id };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          doctor: {
            include: { user: { select: { id: true, name: true } } },
          },
          clinic: { select: { id: true, name: true, address: true, city: true, phone: true } },
          queueItem: true,
          prescription: { select: { id: true, requiresFollowUp: true, followUpDate: true, diagnosis: true } },
          payment: { select: { id: true, status: true, amount: true, method: true } },
        },
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return sendPaginated(res, appointments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/appointments/:id - Get appointment details
 */
const getAppointmentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: req.user.id },
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true, address: true, city: true, phone: true } },
        queueItem: true,
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    return sendSuccess(res, { appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/queue/:appointmentId - Get live queue status
 */
const getLiveQueue = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: req.user.id },
      include: {
        queueItem: {
          include: { queue: true },
        },
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (!appointment.queueItem) {
      return sendSuccess(res, { appointment, queueInfo: null });
    }

    // Get current consultation info
    const currentlyServing = await prisma.queueItem.findFirst({
      where: {
        queueId: appointment.queueItem.queueId,
        status: { in: ['CALLED', 'IN_CONSULTATION'] },
      },
      orderBy: { queueNumber: 'desc' },
    });

    // Count patients ahead
    const patientsAhead = await prisma.queueItem.count({
      where: {
        queueId: appointment.queueItem.queueId,
        status: 'WAITING',
        position: { lt: appointment.queueItem.position },
      },
    });

    const queueInfo = {
      queueNumber: appointment.queueItem.queueNumber,
      position: appointment.queueItem.position,
      status: appointment.queueItem.status,
      estimatedWaitMinutes: appointment.estimatedWaitMinutes,
      patientsAhead,
      currentlyServing: currentlyServing?.queueNumber || null,
      queueStatus: appointment.queueItem.queue.status,
      roomName: `queue:${appointment.clinicId}:${appointment.doctorId}:${new Date().toISOString().split('T')[0]}`,
    };

    return sendSuccess(res, { appointment, queueInfo });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/patient/appointments/:id/cancel - Cancel appointment
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: req.user.id },
      include: { queueItem: true },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (['COMPLETED', 'CANCELLED', 'IN_CONSULTATION'].includes(appointment.status)) {
      return sendError(res, `Cannot cancel appointment with status: ${appointment.status}`, 400);
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    if (appointment.queueItem) {
      await prisma.queueItem.update({
        where: { id: appointment.queueItem.id },
        data: { status: 'CANCELLED' },
      });
    }

    return sendSuccess(res, {}, 'Appointment cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate profile completion percentage
 */
const calcProfileCompletion = (user, profile) => {
  const checks = [
    { field: user?.name, weight: 20 },
    { field: profile?.gender, weight: 15 },
    { field: profile?.dob || profile?.age, weight: 15 },
    { field: profile?.city || profile?.address, weight: 10 },
    { field: profile?.emergencyContact, weight: 10 },
    { field: profile?.bloodGroup, weight: 10 },
    { field: profile?.allergies, weight: 5 },
    { field: profile?.existingDiseases, weight: 5 },
    { field: profile?.insuranceProvider, weight: 5 },
    { field: user?.email, weight: 5 },
  ];
  return checks.reduce((sum, c) => sum + (c.field ? c.weight : 0), 0);
};

/**
 * GET /api/patient/profile - Get patient profile (works for any role)
 */
const getProfile = async (req, res, next) => {
  try {
    // Auto-create patientProfile if missing (e.g. for DOCTOR users using patient features)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patientProfile: true },
    });

    if (!user.patientProfile) {
      await prisma.patientProfile.create({
        data: { userId: req.user.id },
      });
      // Re-fetch with profile
      const updated = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { patientProfile: true },
      });
      const completion = calcProfileCompletion(updated, updated?.patientProfile);
      return sendSuccess(res, { user: updated, profileCompletion: completion });
    }

    const completion = calcProfileCompletion(user, user?.patientProfile);
    return sendSuccess(res, { user, profileCompletion: completion });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/patient/profile - Update patient profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name, email, age, dob, gender, address, city,
      emergencyContact, bloodGroup, allergies,
      existingDiseases, insuranceProvider,
    } = req.body;

    // Determine if required fields are complete after this update
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patientProfile: true },
    });

    const mergedName = name || currentUser?.name;
    const mergedGender = gender || currentUser?.patientProfile?.gender;
    const mergedDob = dob || currentUser?.patientProfile?.dob;
    const mergedAge = age !== undefined ? age : currentUser?.patientProfile?.age;
    const mergedCity = city || currentUser?.patientProfile?.city;
    const mergedEmergency = emergencyContact || currentUser?.patientProfile?.emergencyContact;

    const profileCompleted = !!(
      mergedName && mergedGender && (mergedDob || mergedAge) && (mergedCity || address) && mergedEmergency
    );

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        patientProfile: {
          upsert: {
            create: {
              age: age || null,
              dob: dob ? new Date(dob) : null,
              gender: gender || null,
              address: address || null,
              city: city || null,
              emergencyContact: emergencyContact || null,
              bloodGroup: bloodGroup || null,
              allergies: allergies || null,
              existingDiseases: existingDiseases || null,
              insuranceProvider: insuranceProvider || null,
              profileCompleted,
            },
            update: {
              ...(age !== undefined && { age }),
              ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
              ...(gender && { gender }),
              ...(address !== undefined && { address }),
              ...(city !== undefined && { city }),
              ...(emergencyContact !== undefined && { emergencyContact }),
              ...(bloodGroup !== undefined && { bloodGroup }),
              ...(allergies !== undefined && { allergies }),
              ...(existingDiseases !== undefined && { existingDiseases }),
              ...(insuranceProvider !== undefined && { insuranceProvider }),
              profileCompleted,
            },
          },
        },
      },
      include: { patientProfile: true },
    });

    const completion = calcProfileCompletion(user, user?.patientProfile);
    return sendSuccess(res, { user, profileCompletion: completion }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDoctors,
  getDoctorProfile,
  bookAppointment,
  getMyAppointments,
  getAppointmentDetails,
  getLiveQueue,
  cancelAppointment,
  getProfile,
  updateProfile,
};
