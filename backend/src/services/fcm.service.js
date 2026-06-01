const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Save or update an FCM token for a user.
 * Called when the frontend registers a device token.
 */
const saveFcmToken = async (userId, token, platform = 'web') => {
  try {
    await prisma.fcmToken.upsert({
      where: { token },
      update: { userId, platform, updatedAt: new Date() },
      create: { userId, token, platform },
    });
  } catch (error) {
    logger.error('Failed to save FCM token', { error: error.message, userId });
  }
};

/**
 * Remove an FCM token (e.g. on logout).
 */
const removeFcmToken = async (token) => {
  try {
    await prisma.fcmToken.deleteMany({ where: { token } });
  } catch (error) {
    logger.error('Failed to remove FCM token', { error: error.message });
  }
};

/**
 * Send a push notification to all devices of a user.
 * Uses Firebase Admin SDK if FIREBASE_SERVICE_ACCOUNT_JSON is set,
 * otherwise logs the notification (dev mode).
 */
const sendNotification = async (userId, { title, body, data = {} }) => {
  try {
    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const tokenList = tokens.map((t) => t.token);

    // If Firebase Admin is configured, send real notifications
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const admin = getFirebaseAdmin();
      if (admin) {
        const message = {
          notification: { title, body },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ),
          tokens: tokenList,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        logger.info(`FCM sent to ${response.successCount}/${tokenList.length} devices for user ${userId}`);

        // Clean up invalid tokens
        response.responses.forEach(async (resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
            await prisma.fcmToken.deleteMany({ where: { token: tokenList[idx] } });
          }
        });
        return;
      }
    }

    // Dev mode: just log
    logger.info(`[FCM DEV] Notification to user ${userId}:`, { title, body, data, tokens: tokenList });
  } catch (error) {
    logger.error('Failed to send FCM notification', { error: error.message, userId });
  }
};

/**
 * Lazy-load Firebase Admin SDK to avoid crashing if not configured.
 */
let _firebaseAdmin = null;
const getFirebaseAdmin = () => {
  if (_firebaseAdmin) return _firebaseAdmin;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    _firebaseAdmin = admin;
    return admin;
  } catch (err) {
    logger.warn('Firebase Admin SDK not available. Push notifications disabled.', { error: err.message });
    return null;
  }
};

// ─── Notification helpers ─────────────────────────────────────────────────────

const notifyQueueCalled = (userId, queueNumber) =>
  sendNotification(userId, {
    title: '🔔 Your turn is here!',
    body: `Queue #${queueNumber} — Please proceed to the doctor's room.`,
    data: { type: 'QUEUE_CALLED', queueNumber: String(queueNumber) },
  });

const notifyAppointmentBooked = (userId, doctorName, date) =>
  sendNotification(userId, {
    title: '✅ Appointment Confirmed',
    body: `Your appointment with ${doctorName} on ${new Date(date).toLocaleDateString()} is confirmed.`,
    data: { type: 'APPOINTMENT_BOOKED' },
  });

const notifyFollowUpReady = (userId, doctorName) =>
  sendNotification(userId, {
    title: '🔄 Follow-up Ready',
    body: `Your follow-up with ${doctorName} has been added to the priority queue.`,
    data: { type: 'FOLLOW_UP_READY' },
  });

const notifyPrescriptionReady = (userId, doctorName) =>
  sendNotification(userId, {
    title: '📋 Prescription Ready',
    body: `Dr. ${doctorName} has issued your prescription. Tap to view.`,
    data: { type: 'PRESCRIPTION_READY' },
  });

const notifyPaymentSuccess = (userId, amount) =>
  sendNotification(userId, {
    title: '💳 Payment Successful',
    body: `Payment of ₹${amount} received successfully.`,
    data: { type: 'PAYMENT_SUCCESS' },
  });

module.exports = {
  saveFcmToken,
  removeFcmToken,
  sendNotification,
  notifyQueueCalled,
  notifyAppointmentBooked,
  notifyFollowUpReady,
  notifyPrescriptionReady,
  notifyPaymentSuccess,
};
