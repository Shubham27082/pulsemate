const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * FCM Notification Service
 * Sends push notifications via Firebase Cloud Messaging.
 * Requires FIREBASE_SERVER_KEY in .env
 * Falls back to console logging in development.
 */

const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

/**
 * Send a push notification to a single user by userId.
 * Looks up all FCM tokens registered for that user.
 */
const sendToUser = async (userId, { title, body, data = {} }) => {
  try {
    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const tokenList = tokens.map((t) => t.token);

    if (!process.env.FIREBASE_SERVER_KEY) {
      // Dev fallback — just log
      logger.info(`[FCM-DEV] → User ${userId} | ${title}: ${body}`, { data, tokens: tokenList });
      return;
    }

    const payload = {
      registration_ids: tokenList,
      notification: { title, body, sound: 'default' },
      data,
      priority: 'high',
    };

    const response = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Clean up invalid tokens
    if (result.results) {
      const invalidTokens = [];
      result.results.forEach((r, i) => {
        if (r.error === 'InvalidRegistration' || r.error === 'NotRegistered') {
          invalidTokens.push(tokenList[i]);
        }
      });
      if (invalidTokens.length > 0) {
        await prisma.fcmToken.deleteMany({ where: { token: { in: invalidTokens } } });
        logger.info(`Cleaned up ${invalidTokens.length} invalid FCM tokens`);
      }
    }

    logger.info(`FCM sent to user ${userId}: ${title}`);
  } catch (error) {
    // Notification failure must never break the main flow
    logger.error('FCM send failed', { error: error.message, userId });
  }
};

/**
 * Notify patient their turn is coming up
 */
const notifyQueueCalled = async (patientId, queueNumber, doctorName) => {
  await sendToUser(patientId, {
    title: '🔔 Your Turn!',
    body: `Queue #${queueNumber} — Please proceed to Dr. ${doctorName}'s room.`,
    data: { type: 'QUEUE_CALLED', queueNumber: String(queueNumber) },
  });
};

/**
 * Notify patient of appointment confirmation
 */
const notifyAppointmentBooked = async (patientId, doctorName, date, queueNumber) => {
  await sendToUser(patientId, {
    title: '✅ Appointment Confirmed',
    body: `Booked with Dr. ${doctorName} on ${new Date(date).toLocaleDateString()}${queueNumber ? ` — Queue #${queueNumber}` : ''}.`,
    data: { type: 'APPOINTMENT_BOOKED' },
  });
};

/**
 * Notify patient of follow-up reminder
 */
const notifyFollowUpReminder = async (patientId, doctorName, followUpDate) => {
  await sendToUser(patientId, {
    title: '📅 Follow-Up Reminder',
    body: `Your follow-up with Dr. ${doctorName} is on ${new Date(followUpDate).toLocaleDateString()}.`,
    data: { type: 'FOLLOW_UP_REMINDER' },
  });
};

/**
 * Notify patient that queue is paused
 */
const notifyQueuePaused = async (patientIds, doctorName) => {
  for (const patientId of patientIds) {
    await sendToUser(patientId, {
      title: '⏸️ Queue Paused',
      body: `Dr. ${doctorName}'s queue has been temporarily paused. Please wait.`,
      data: { type: 'QUEUE_PAUSED' },
    });
  }
};

module.exports = {
  sendToUser,
  notifyQueueCalled,
  notifyAppointmentBooked,
  notifyFollowUpReminder,
  notifyQueuePaused,
};
