const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { notifyQueueCalled, notifyQueuePaused } = require('../services/notification.service');

/**
 * Helper: Get or create today's queue for a doctor in a clinic
 */
const getOrCreateQueue = async (clinicId, doctorId) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let queue = await prisma.queue.findFirst({
    where: { clinicId, doctorId, date: today },
  });

  if (!queue) {
    queue = await prisma.queue.create({
      data: { clinicId, doctorId, date: today, status: 'ACTIVE' },
    });
  }

  return queue;
};

/**
 * Helper: Recalculate positions for waiting items in a queue.
 * Follow-up patients are sorted BEFORE regular patients at the same position tier.
 * Priority order: follow-up WAITING first, then regular WAITING — both sorted by queueNumber.
 */
const recalculatePositions = async (queueId, doctorAvgMins = 10) => {
  const waitingItems = await prisma.queueItem.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: [
      { isFollowUp: 'desc' }, // follow-ups first
      { queueNumber: 'asc' },
    ],
  });

  for (let i = 0; i < waitingItems.length; i++) {
    await prisma.queueItem.update({
      where: { id: waitingItems[i].id },
      data: { position: i + 1 },
    });

    if (waitingItems[i].appointmentId) {
      await prisma.appointment.update({
        where: { id: waitingItems[i].appointmentId },
        data: { estimatedWaitMinutes: (i + 1) * doctorAvgMins },
      });
    }
  }

  return waitingItems;
};

/**
 * GET /api/reception/queue/:doctorId - Get today's queue
 */
const getQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { clinicId } = req.query;

    if (!clinicId) {
      return sendError(res, 'clinicId query param is required', 400);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const queue = await prisma.queue.findFirst({
      where: { clinicId, doctorId, date: today },
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        queueItems: {
          orderBy: [{ isFollowUp: 'desc' }, { position: 'asc' }],
          include: {
            patient: { select: { id: true, name: true, mobile: true } },
            appointment: {
              select: {
                id: true,
                symptoms: true,
                appointmentType: true,
                slotTime: true,
                estimatedWaitMinutes: true,
                doctor: {
                  select: { consultationFee: true },
                },
                payment: {
                  select: { status: true, amount: true, method: true },
                },
                prescription: { select: { requiresFollowUp: true } },
              },
            },
          },
        },
      },
    });

    if (!queue) {
      return sendSuccess(res, { queue: null, queueItems: [] });
    }

    return sendSuccess(res, { queue, queueItems: queue.queueItems });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reception/walk-in - Add walk-in patient
 */
const addWalkIn = async (req, res, next) => {
  try {
    const { doctorId, clinicId, patientMobile, patientName, symptoms } = req.body;

    // Find or create patient
    let patient = await prisma.user.findUnique({ where: { mobile: patientMobile } });

    if (!patient) {
      patient = await prisma.user.create({
        data: {
          mobile: patientMobile,
          name: patientName || 'Walk-in Patient',
          role: 'PATIENT',
          patientProfile: { create: {} },
        },
      });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctorProfile) {
      return sendError(res, 'Doctor not found', 404);
    }

    const queue = await getOrCreateQueue(clinicId, doctorId);

    if (queue.status === 'CLOSED') {
      return sendError(res, 'Queue is closed for today', 400);
    }

    // Get next queue number
    const lastItem = await prisma.queueItem.findFirst({
      where: { queueId: queue.id },
      orderBy: { queueNumber: 'desc' },
    });
    const queueNumber = (lastItem?.queueNumber || 0) + 1;

    // Count waiting patients for position (regular walk-ins go after follow-ups)
    const waitingCount = await prisma.queueItem.count({
      where: { queueId: queue.id, status: 'WAITING' },
    });

    // Create appointment for walk-in
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        clinicId,
        appointmentType: 'OFFLINE',
        appointmentDate: new Date(),
        status: 'IN_QUEUE',
        queueNumber,
        symptoms,
        estimatedWaitMinutes: (waitingCount + 1) * (doctorProfile.avgConsultationMins || 10),
      },
    });

    const queueItem = await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: appointment.id,
        patientId: patient.id,
        queueNumber,
        status: 'WAITING',
        position: waitingCount + 1,
        isFollowUp: false,
      },
    });

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${clinicId}:${doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'PATIENT_ADDED',
        queueItem: { ...queueItem, patient: { name: patient.name, mobile: patient.mobile } },
      });
    }

    return sendSuccess(res, { appointment, queueItem, queueNumber }, 'Walk-in patient added to queue', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reception/follow-up - Add a follow-up patient back to the queue with priority
 * This is called when a patient returns after tests/BP/X-ray etc.
 * Follow-up patients are inserted AHEAD of regular waiting patients.
 */
const addFollowUp = async (req, res, next) => {
  try {
    const { doctorId, clinicId, originalAppointmentId, symptoms } = req.body;

    // Verify original appointment exists
    const originalAppointment = await prisma.appointment.findUnique({
      where: { id: originalAppointmentId },
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        prescription: { select: { requiresFollowUp: true, diagnosis: true } },
      },
    });

    if (!originalAppointment) {
      return sendError(res, 'Original appointment not found', 404);
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctorProfile) {
      return sendError(res, 'Doctor not found', 404);
    }

    const queue = await getOrCreateQueue(clinicId, doctorId);

    if (queue.status === 'CLOSED') {
      return sendError(res, 'Queue is closed for today', 400);
    }

    // Get next queue number (follow-ups get an F-prefix conceptually but same int sequence)
    const lastItem = await prisma.queueItem.findFirst({
      where: { queueId: queue.id },
      orderBy: { queueNumber: 'desc' },
    });
    const queueNumber = (lastItem?.queueNumber || 0) + 1;

    // Count ONLY regular (non-follow-up) waiting patients — follow-up goes before them
    const regularWaitingCount = await prisma.queueItem.count({
      where: { queueId: queue.id, status: 'WAITING', isFollowUp: false },
    });

    // Follow-up position = number of other follow-ups already waiting + 1
    const followUpWaitingCount = await prisma.queueItem.count({
      where: { queueId: queue.id, status: 'WAITING', isFollowUp: true },
    });

    const position = followUpWaitingCount + 1; // goes before regular patients

    // Create a new appointment for the follow-up visit
    const followUpAppointment = await prisma.appointment.create({
      data: {
        patientId: originalAppointment.patientId,
        doctorId,
        clinicId,
        appointmentType: 'OFFLINE',
        appointmentDate: new Date(),
        status: 'IN_QUEUE',
        queueNumber,
        symptoms: symptoms || `Follow-up from appointment ${originalAppointmentId}`,
        estimatedWaitMinutes: position * (doctorProfile.avgConsultationMins || 10),
      },
    });

    const queueItem = await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: followUpAppointment.id,
        patientId: originalAppointment.patientId,
        queueNumber,
        status: 'WAITING',
        position,
        isFollowUp: true,
        followUpOf: originalAppointmentId,
      },
    });

    // Push regular patients' positions down by 1
    await prisma.queueItem.updateMany({
      where: {
        queueId: queue.id,
        status: 'WAITING',
        isFollowUp: false,
      },
      data: { position: { increment: 1 } },
    });

    // Update estimated wait for all regular waiting patients
    const regularWaiting = await prisma.queueItem.findMany({
      where: { queueId: queue.id, status: 'WAITING', isFollowUp: false },
    });
    for (const item of regularWaiting) {
      if (item.appointmentId) {
        await prisma.appointment.update({
          where: { id: item.appointmentId },
          data: { estimatedWaitMinutes: item.position * (doctorProfile.avgConsultationMins || 10) },
        });
      }
    }

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${clinicId}:${doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'FOLLOW_UP_ADDED',
        queueItem: {
          ...queueItem,
          patient: {
            name: originalAppointment.patient.name,
            mobile: originalAppointment.patient.mobile,
          },
          isFollowUp: true,
        },
      });
      io.to(roomName).emit('queue:positionUpdated', { queueId: queue.id });
    }

    return sendSuccess(
      res,
      { appointment: followUpAppointment, queueItem, queueNumber },
      `Follow-up patient added with priority (position #${position})`,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueItemId/check-in - Check in booked patient
 */
const checkIn = async (req, res, next) => {
  try {
    const { queueItemId } = req.params;

    const queueItem = await prisma.queueItem.findUnique({
      where: { id: queueItemId },
      include: { queue: true, appointment: true },
    });

    if (!queueItem) {
      return sendError(res, 'Queue item not found', 404);
    }

    if (queueItem.status !== 'WAITING') {
      return sendError(res, 'Patient is not in waiting status', 400);
    }

    await prisma.appointment.update({
      where: { id: queueItem.appointmentId },
      data: { status: 'CHECKED_IN' },
    });

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queueItem.queue.clinicId}:${queueItem.queue.doctorId}:${today}`).emit('queue:updated', {
        type: 'PATIENT_CHECKED_IN',
        queueItemId,
      });
    }

    return sendSuccess(res, { queueItem }, 'Patient checked in');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueId/call-next - Call next patient
 * Follow-up patients are called before regular patients.
 */
const callNext = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { doctor: true },
    });

    if (!queue) {
      return sendError(res, 'Queue not found', 404);
    }

    if (queue.status === 'PAUSED') {
      return sendError(res, 'Queue is paused', 400);
    }

    // Mark current IN_CONSULTATION as completed if any
    const currentConsultation = await prisma.queueItem.findFirst({
      where: { queueId, status: 'IN_CONSULTATION' },
    });

    if (currentConsultation) {
      await prisma.queueItem.update({
        where: { id: currentConsultation.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      if (currentConsultation.appointmentId) {
        await prisma.appointment.update({
          where: { id: currentConsultation.appointmentId },
          data: { status: 'COMPLETED' },
        });
      }
    }

    // Mark current CALLED as IN_CONSULTATION
    const calledItem = await prisma.queueItem.findFirst({
      where: { queueId, status: 'CALLED' },
    });

    if (calledItem) {
      await prisma.queueItem.update({
        where: { id: calledItem.id },
        data: { status: 'IN_CONSULTATION' },
      });
      if (calledItem.appointmentId) {
        await prisma.appointment.update({
          where: { id: calledItem.appointmentId },
          data: { status: 'IN_CONSULTATION' },
        });
      }
    }

    // Get next WAITING patient — follow-ups first, then by position
    const nextItem = await prisma.queueItem.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: [
        { isFollowUp: 'desc' }, // follow-ups first
        { position: 'asc' },
      ],
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        appointment: true,
      },
    });

    if (!nextItem) {
      return sendSuccess(res, { message: 'No more patients in queue' });
    }

    // Call the next patient
    await prisma.queueItem.update({
      where: { id: nextItem.id },
      data: { status: 'CALLED', calledAt: new Date() },
    });

    if (nextItem.appointmentId) {
      await prisma.appointment.update({
        where: { id: nextItem.appointmentId },
        data: { status: 'IN_CONSULTATION' },
      });
    }

    // Recalculate positions for remaining waiting patients
    const avgMins = queue.doctor?.avgConsultationMins || 10;
    await recalculatePositions(queueId, avgMins);

    // Send FCM push notification to the called patient
    await notifyQueueCalled(
      nextItem.patientId,
      nextItem.queueNumber,
      queue.doctor?.user?.name || 'the doctor'
    );

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${queue.clinicId}:${queue.doctorId}:${today}`;

      io.to(roomName).emit('queue:called', {
        patientId: nextItem.patientId,
        queueNumber: nextItem.queueNumber,
        patientName: nextItem.patient.name,
        isFollowUp: nextItem.isFollowUp,
      });

      io.to(roomName).emit('queue:positionUpdated', {
        queueId,
        calledQueueNumber: nextItem.queueNumber,
      });
    }

    return sendSuccess(
      res,
      { calledPatient: nextItem },
      `Patient #${nextItem.queueNumber} called${nextItem.isFollowUp ? ' (Follow-up)' : ''}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue-item/:id/skip - Skip patient
 */
const skipPatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queueItem = await prisma.queueItem.findUnique({
      where: { id },
      include: { queue: true },
    });

    if (!queueItem) {
      return sendError(res, 'Queue item not found', 404);
    }

    await prisma.queueItem.update({
      where: { id },
      data: { status: 'SKIPPED' },
    });

    if (queueItem.appointmentId) {
      await prisma.appointment.update({
        where: { id: queueItem.appointmentId },
        data: { status: 'NO_SHOW' },
      });
    }

    const avgMins = 10;
    await recalculatePositions(queueItem.queueId, avgMins);

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queueItem.queue.clinicId}:${queueItem.queue.doctorId}:${today}`).emit('queue:updated', {
        type: 'PATIENT_SKIPPED',
        queueItemId: id,
      });
    }

    return sendSuccess(res, {}, 'Patient skipped');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue-item/:id/complete - Mark patient complete
 */
const completePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queueItem = await prisma.queueItem.findUnique({
      where: { id },
      include: { queue: true },
    });

    if (!queueItem) {
      return sendError(res, 'Queue item not found', 404);
    }

    await prisma.queueItem.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    if (queueItem.appointmentId) {
      await prisma.appointment.update({
        where: { id: queueItem.appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queueItem.queue.clinicId}:${queueItem.queue.doctorId}:${today}`).emit('queue:completed', {
        queueItemId: id,
        queueNumber: queueItem.queueNumber,
      });
    }

    return sendSuccess(res, {}, 'Patient marked as completed');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueId/pause - Pause queue
 */
const pauseQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: { status: 'PAUSED' },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    });

    // Notify all waiting patients
    const waitingItems = await prisma.queueItem.findMany({
      where: { queueId, status: 'WAITING' },
      select: { patientId: true },
    });
    const patientIds = [...new Set(waitingItems.map((i) => i.patientId))];
    const doctorName = queue.doctor?.user?.name || 'the doctor';
    await notifyQueuePaused(patientIds, doctorName);

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queue.clinicId}:${queue.doctorId}:${today}`).emit('queue:paused', { queueId });
    }

    return sendSuccess(res, { queue }, 'Queue paused');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueId/resume - Resume queue
 */
const resumeQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: { status: 'ACTIVE' },
    });

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queue.clinicId}:${queue.doctorId}:${today}`).emit('queue:resumed', { queueId });
    }

    return sendSuccess(res, { queue }, 'Queue resumed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueue,
  addWalkIn,
  addFollowUp,
  checkIn,
  callNext,
  skipPatient,
  completePatient,
  pauseQueue,
  resumeQueue,
};
