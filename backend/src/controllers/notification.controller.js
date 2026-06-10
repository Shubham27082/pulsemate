const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/notifications/fcm-token
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
 * DELETE /api/notifications/fcm-token
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
 * Returns smart notifications derived from the patient's real data,
 * plus any campaign UserNotification rows sent by admin.
 * Read state is persisted in NotificationRead table.
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [todayAppts, recentAppts, user, readRows, campaignNotifs] = await Promise.all([
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
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, name: true, freeBookingUsed: true },
      }),
      prisma.notificationRead.findMany({
        where: { userId },
        select: { notificationId: true },
      }).catch(() => []),
      // Fetch real campaign notifications for this user
      prisma.userNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch(() => []),
    ]);

    // Build set of persisted-read notification IDs
    const readSet = new Set(readRows.map((r) => r.notificationId));

    const notifications = [];

    for (const appt of todayAppts) {
      const docName = appt.doctor?.user?.name || 'your doctor';
      const clinic = appt.clinic?.name || 'the clinic';
      const qNum = appt.queueNumber;
      const slotTime = appt.slotTime || '';

      if (appt.status === 'CALLED' || appt.status === 'IN_CONSULTATION') {
        const nId = `called_${appt.id}`;
        notifications.push({
          id: nId,
          type: 'QUEUE_CALLED',
          category: 'Queue Updates',
          title: 'Your turn is near!',
          body: `Token ${qNum} – Dr. ${docName}`,
          sub: `Please be at ${clinic}`,
          time: now,
          read: readSet.has(nId),
          icon: 'notifications',
          color: '#10B981',
          bg: '#ECFDF5',
          apptId: appt.id,
        });
      } else if (appt.status === 'IN_QUEUE' || appt.status === 'BOOKED') {
        const nId = `queue_${appt.id}`;
        notifications.push({
          id: nId,
          type: 'QUEUE_UPDATE',
          category: 'Queue Updates',
          title: 'Queue Update',
          body: `Token ${qNum} is in progress. Est. wait: ${appt.estimatedWaitMinutes || 15}–${(appt.estimatedWaitMinutes || 15) + 5} mins.`,
          sub: `Dr. ${docName} · ${clinic}`,
          time: now,
          read: readSet.has(nId),
          icon: 'people',
          color: '#2563EB',
          bg: '#EFF6FF',
          apptId: appt.id,
        });
      }

      const cId = `confirmed_${appt.id}`;
      notifications.push({
        id: cId,
        type: 'APPOINTMENT_CONFIRMED',
        category: 'Appointments',
        title: 'Appointment Confirmed',
        body: `Your appointment with Dr. ${docName} is confirmed.`,
        sub: slotTime ? `Today at ${slotTime} · ${clinic}` : `Today · ${clinic}`,
        time: new Date(appt.createdAt || now),
        read: readSet.has(cId) || true, // confirmed are read by default
        icon: 'calendar',
        color: '#7C3AED',
        bg: '#F5F3FF',
        apptId: appt.id,
      });
    }

    for (const appt of recentAppts) {
      const docName = appt.doctor?.user?.name || 'your doctor';
      const clinic = appt.clinic?.name || '';
      const dateStr = new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
      const rId = `recent_${appt.id}`;
      notifications.push({
        id: rId,
        type: 'APPOINTMENT_CONFIRMED',
        category: 'Appointments',
        title: appt.status === 'COMPLETED' ? 'Appointment Completed' : 'Appointment Confirmed',
        body: `Your appointment with Dr. ${docName} on ${dateStr}.`,
        sub: clinic,
        time: new Date(appt.appointmentDate),
        read: readSet.has(rId) || true,
        icon: 'calendar',
        color: '#7C3AED',
        bg: '#F5F3FF',
        apptId: appt.id,
      });
    }

    notifications.push({
      id: 'offer_checkup',
      type: 'OFFER',
      category: 'Offers',
      title: 'Special Health Check-up Offer!',
      body: 'Get 20% off on Full Body Check-up.',
      sub: 'Book now and stay healthy!',
      time: new Date(now - 2 * 24 * 60 * 60 * 1000),
      read: readSet.has('offer_checkup') || true,
      icon: 'pricetag',
      color: '#10B981',
      bg: '#ECFDF5',
    });

    if (user) {
      // Free booking offer — only show if benefit not yet used
      if (!user.freeBookingUsed) {
        notifications.push({
          id: 'free_booking_offer',
          type: 'OFFER',
          category: 'Offers',
          title: '🎉 Your First Booking is FREE!',
          body: 'Book your first appointment on PulseMate at no charge. No payment required!',
          sub: 'Tap to find a doctor near you',
          time: new Date(user.createdAt),
          read: readSet.has('free_booking_offer'),
          icon: 'gift',
          color: '#10B981',
          bg: '#ECFDF5',
        });
      }

      notifications.push({
        id: 'welcome',
        type: 'WELCOME',
        category: 'Appointments',
        title: 'Welcome to PulseMate!',
        body: `Hi ${user.name || 'there'}! We're here to take care of your health.`,
        sub: '',
        time: new Date(user.createdAt),
        read: readSet.has('welcome') || true,
        icon: 'megaphone',
        color: '#2563EB',
        bg: '#EFF6FF',
      });
    }

    // ── Admin Campaign Notifications ──────────────────────────────────────────
    for (const cn of campaignNotifs) {
      const cnId = `campaign_${cn.id}`;
      notifications.push({
        id: cnId,
        type: 'CAMPAIGN',
        category: 'Offers',
        title: cn.title,
        body: cn.message,
        sub: '',
        time: cn.createdAt,
        read: cn.isRead || readSet.has(cnId),
        icon: 'megaphone',
        color: '#2563EB',
        bg: '#EFF6FF',
      });
    }

    // Override read=false for any notification explicitly NOT in readSet
    // (queue/called notifications default to unread until explicitly read)
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return sendSuccess(res, { notifications, unreadCount });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/notifications/:id/read
 * Persists notification read state in the DB.
 * Also marks UserNotification.isRead=true for campaign_ prefixed ids.
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Handle campaign notification read
    if (notificationId.startsWith('campaign_')) {
      const userNotifId = notificationId.replace('campaign_', '');
      await prisma.userNotification.updateMany({
        where: { id: userNotifId, userId },
        data: { isRead: true },
      }).catch(() => { });
    }

    await prisma.notificationRead.upsert({
      where: { userId_notificationId: { userId, notificationId } },
      create: { userId, notificationId },
      update: { readAt: new Date() },
    }).catch(() => { });
    return sendSuccess(res, {}, 'Notification marked as read');
  } catch (error) { next(error); }
};

/**
 * PATCH /api/notifications/read-all
 * Marks all current notifications as read for this user.
 */
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Gather all notification IDs (same logic as getMyNotifications)
    const [todayAppts, recentAppts] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: userId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        select: { id: true, status: true },
      }),
      prisma.appointment.findMany({
        where: { patientId: userId, appointmentDate: { gte: weekAgo, lt: todayStart }, status: { in: ['COMPLETED', 'BOOKED'] } },
        select: { id: true },
        take: 5,
      }),
    ]);

    const ids = [];
    for (const appt of todayAppts) {
      if (appt.status === 'CALLED' || appt.status === 'IN_CONSULTATION') ids.push(`called_${appt.id}`);
      else if (appt.status === 'IN_QUEUE' || appt.status === 'BOOKED') ids.push(`queue_${appt.id}`);
      ids.push(`confirmed_${appt.id}`);
    }
    for (const appt of recentAppts) ids.push(`recent_${appt.id}`);
    ids.push('offer_checkup', 'welcome', 'free_booking_offer');

    // Upsert all — ignore errors for individual rows
    await Promise.all(
      ids.map((notificationId) =>
        prisma.notificationRead.upsert({
          where: { userId_notificationId: { userId, notificationId } },
          create: { userId, notificationId },
          update: { readAt: new Date() },
        }).catch(() => { })
      )
    );

    return sendSuccess(res, {}, 'All notifications marked as read');
  } catch (error) { next(error); }
};

/**
 * GET /api/notifications/inbox
 * Returns paginated UserNotification rows for this user (from admin campaigns).
 */
const getUserCampaignNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { campaign: { select: { title: true, status: true } } },
      }),
      prisma.userNotification.count({ where: { userId } }),
      prisma.userNotification.count({ where: { userId, isRead: false } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: { notifications, unreadCount },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/notifications/inbox/:id/read
 */
const markCampaignNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await prisma.userNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return sendSuccess(res, {}, 'Notification marked as read');
  } catch (error) { next(error); }
};

/**
 * PATCH /api/notifications/inbox/read-all
 */
const markAllCampaignNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return sendSuccess(res, {}, 'All notifications marked as read');
  } catch (error) { next(error); }
};

module.exports = {
  registerFcmToken,
  removeFcmToken,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserCampaignNotifications,
  markCampaignNotificationRead,
  markAllCampaignNotificationsRead,
};
