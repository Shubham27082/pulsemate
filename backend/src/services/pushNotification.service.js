/**
 * Push notification service using Firebase Admin SDK.
 * Gracefully degrades when Firebase is not configured.
 */
const { isFirebaseReady } = require('../config/firebase');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Send a push notification to a single FCM token.
 * @param {string} fcmToken
 * @param {string} title
 * @param {string} message
 * @param {object} data  - optional key/value pairs for notification payload
 */
const sendPushToToken = async (fcmToken, title, message, data = {}) => {
  if (!isFirebaseReady()) {
    logger.warn(`[PUSH-MOCK] Token: ${fcmToken} | Title: ${title} | Body: ${message}`);
    return { success: false, reason: 'firebase_not_configured' };
  }

  try {
    const admin = require('firebase-admin');
    const stringData = {};
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = String(v);
    }

    const result = await admin.messaging().send({
      token: fcmToken,
      notification: { title, body: message },
      data: stringData,
      android: { priority: 'high' },
      apns: { payload: { aps: { contentAvailable: true, sound: 'default' } } },
    });

    return { success: true, messageId: result };
  } catch (error) {
    logger.error(`Push notification failed for token ${fcmToken}:`, error.message);

    // Token is invalid or unregistered — deactivate it
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      await prisma.fcmToken.deleteMany({ where: { token: fcmToken } }).catch(() => { });
    }

    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications to all active FCM tokens for a list of userIds.
 * @param {string[]} userIds
 * @param {string} title
 * @param {string} message
 * @param {object} data
 */
const sendPushToUsers = async (userIds, title, message, data = {}) => {
  if (!userIds || userIds.length === 0) return { sent: 0, failed: 0 };

  if (!isFirebaseReady()) {
    logger.warn(`[PUSH-MOCK] Sending to ${userIds.length} users | Title: ${title}`);
    return { sent: 0, failed: 0, reason: 'firebase_not_configured' };
  }

  const tokens = await prisma.fcmToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });

  if (tokens.length === 0) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(
    tokens.map((t) => sendPushToToken(t.token, title, message, data))
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - sent;

  logger.info(`Push notifications: ${sent} sent, ${failed} failed out of ${tokens.length} tokens for ${userIds.length} users`);
  return { sent, failed };
};

module.exports = { sendPushToToken, sendPushToUsers };
