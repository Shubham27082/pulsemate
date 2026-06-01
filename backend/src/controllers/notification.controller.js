const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/notifications/fcm-token - Register or update FCM token for current user
 */
const registerFcmToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) return sendError(res, 'FCM token is required', 400);
    await prisma.fcmToken.upsert({
      where: { token },
      create: { userId: req.user.id, token, platform: platform || 'web' },
      update: { userId: req.user.id, platform: platform || 'web' },
    });
    return sendSuccess(res, {}, 'FCM token registered');
  } catch (error) { next(error); }
};

/**
 * DELETE /api/notifications/fcm-token - Remove FCM token on logout
 */
const removeFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, 'FCM token is required', 400);
    await prisma.fcmToken.deleteMany({ where: { token, userId: req.user.id } });
    return sendSuccess(res, {}, 'FCM token removed');
  } catch (error) { next(error); }
};

/**
 * GET /api/notifications/my
 * Returns smart notifications derived from the patient's real data:
 * - Today's booked appointments
 * - Queue updates (BOOKED/IN_QUEUE items)
 * - Follow-up reminders from prescriptions
 * - Past completed appointments (confirmation)
 * - Welcome message
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);
    const weekAgo    = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Fetch relevant data in parallel
    const [todayAppts, recentAppts, followUpRx, user] = await Promise.all([
      // Today's appointments
      prisma.appointment.findMany({
        where: {
          patientId: userId,
          appointmentDate: { gte: todayStart, lte: todayEnd },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          clinic: { select: { name: true } },
          queueItem: true,
        },
        orderBy: { appointmentDate: 'asc' },
      }),
      // Recent completed/booked appointments (last 7 days)
      prisma.appointment.findMany({
        where: {
          patientId: userId,
          appointmentDate: { gte: weekAgo, lt: todayStart },
          status: { in: ['COMPLETED', 'BOOKED'] },
        },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          clinic: { select: { name: true } },
        },
        orderBy: { appointmentDate: 'desc' },
        take: 5,
      }),
      // Prescriptions with upcoming follow-ups
      prisma.prescription.findMany({
        where: {
          patientId: userId,
          requiresFollowUp: true,
          followUpDate: { gte: now },
        },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { followUpDate: 'asc' },
        take: 3,
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true, name: true } }),
    ]);

    const notifications = [];

    // ── Today's queue notifications ──────────────────────────────────────────
    for (const appt of todayAppts) {
      const docName  = appt.doctor?.user?.name || 'your doctor';
      const clinic   = appt.clinic?.name || 'the clinic';
      const qNum     = appt.queueNumber;
      const slotTime = appt.slotTime || '';

      if (appt.status === 'CALLED' || appt.status === 'IN_CONSULTATION') {
        notifications.push({
          id:       `called_${appt.id}`,
          type:     'QUEUE_CALLED',
          category: 'Queue Updates',
          title:    'Your turn is near!',
          body:     `Token ${qNum} – Dr. ${docName}`,
          sub:      `Please be at ${clinic}`,
          time:     now,
          read:     false,
          icon:     'notifications',
          color:    '#10B981',
          bg:       '#ECFDF5',
          apptId:   appt.id,
        });
      } else if (appt.status === 'IN_QUEUE' || appt.status === 'BOOKED') {
        notifications.push({
          id:       `queue_${appt.id}`,
          type:     'QUEUE_UPDATE',
          category: 'Queue Updates',
          title:    'Queue Update',
          body:     `Token ${qNum} is in progress. Est. wait: ${appt.estimatedWaitMinutes || 15}–${(appt.estimatedWaitMinutes || 15) + 5} mins.`,
          sub:      `Dr. ${docName} · ${clinic}`,
          time:     now,
          read:     false,
          icon:     'people',
          color:    '#2563EB',
          bg:       '#EFF6FF',
          apptId:   appt.id,
        });
      }

      // Appointment confirmed today
      notifications.push({
        id:       `confirmed_${appt.id}`,
        type:     'APPOINTMENT_CONFIRMED',
        category: 'Appointments',
        title:    'Appointment Confirmed',
        body:     `Your appointment with Dr. ${docName} is confirmed.`,
        sub:      slotTime ? `Today at ${slotTime} · ${clinic}` : `Today · ${clinic}`,
        time:     new Date(appt.createdAt || now),
        read:     true,
        icon:     'calendar',
        color:    '#7C3AED',
        bg:       '#F5F3FF',
        apptId:   appt.id,
      });
    }

    // ── Recent appointment confirmations ─────────────────────────────────────
    for (const appt of recentAppts) {
      const docName = appt.doctor?.user?.name || 'your doctor';
      const clinic  = appt.clinic?.name || '';
      const dateStr = new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      notifications.push({
        id:       `recent_${appt.id}`,
        type:     'APPOINTMENT_CONFIRMED',
        category: 'Appointments',
        title:    appt.status === 'COMPLETED' ? 'Appointment Completed' : 'Appointment Confirmed',
        body:     `Your appointment with Dr. ${docName} on ${dateStr}.`,
        sub:      clinic,
        time:     new Date(appt.appointmentDate),
        read:     true,
        icon:     'calendar',
        color:    '#7C3AED',
        bg:       '#F5F3FF',
        apptId:   appt.id,
      });
    }

    // ── Follow-up reminders ───────────────────────────────────────────────────
    for (const rx of followUpRx) {
      const docName  = rx.doctor?.user?.name || 'your doctor';
      const dateStr  = new Date(rx.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      notifications.push({
        id:       `followup_${rx.id}`,
        type:     'FOLLOW_UP_REMINDER',
        category: 'Reminders',
        title:    'Follow-up Reminder',
        body:     `Don't forget your follow-up appointment with Dr. ${docName} on ${dateStr}.`,
        sub:      '',
        time:     new Date(rx.followUpDate - 2 * 24 * 60 * 60 * 1000),
        read:     false,
        icon:     'notifications',
        color:    '#EF4444',
        bg:       '#FEF2F2',
        rxId:     rx.id,
      });
    }

    // ── Static / welcome notifications ───────────────────────────────────────
    notifications.push({
      id:       'offer_checkup',
      type:     'OFFER',
      category: 'Offers',
      title:    'Special Health Check-up Offer!',
      body:     'Get 20% off on Full Body Check-up.',
      sub:      'Book now and stay healthy!',
      time:     new Date(now - 2 * 24 * 60 * 60 * 1000),
      read:     true,
      icon:     'pricetag',
      color:    '#10B981',
      bg:       '#ECFDF5',
    });

    if (user) {
      notifications.push({
        id:       'welcome',
        type:     'WELCOME',
        category: 'Appointments',
        title:    'Welcome to PulseMate!',
        body:     `Hi ${user.name || 'there'}! We're here to take care of your health.`,
        sub:      '',
        time:     new Date(user.createdAt),
        read:     true,
        icon:     'megaphone',
        color:    '#2563EB',
        bg:       '#EFF6FF',
      });
    }

    // Sort by time descending
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return sendSuccess(res, { notifications, unreadCount });
  } catch (error) { next(error); }
};

module.exports = { registerFcmToken, removeFcmToken, getMyNotifications };
