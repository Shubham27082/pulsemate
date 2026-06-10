/**
 * Device token management routes.
 * Mounted at: /api/device-token
 */
const express = require('express');
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { authenticateUser } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/device-token/register
 * Save or update an FCM token for the logged-in user.
 */
router.post('/register', authenticateUser, async (req, res, next) => {
  try {
    const { fcmToken, platform = 'ANDROID' } = req.body;
    if (!fcmToken?.trim()) return sendError(res, 'fcmToken is required', 400);

    const validPlatforms = ['ANDROID', 'IOS', 'WEB'];
    const normalizedPlatform = platform.toUpperCase();
    if (!validPlatforms.includes(normalizedPlatform)) {
      return sendError(res, `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`, 400);
    }

    await prisma.fcmToken.upsert({
      where: { token: fcmToken.trim() },
      create: {
        userId: req.user.id,
        token: fcmToken.trim(),
        platform: normalizedPlatform,
      },
      update: {
        userId: req.user.id,
        platform: normalizedPlatform,
      },
    });

    return sendSuccess(res, {}, 'Device token registered');
  } catch (error) { next(error); }
});

/**
 * POST /api/device-token/deactivate
 * Remove/deactivate an FCM token.
 */
router.post('/deactivate', async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken?.trim()) return sendError(res, 'fcmToken is required', 400);

    await prisma.fcmToken.deleteMany({ where: { token: fcmToken.trim() } });
    return sendSuccess(res, {}, 'Device token deactivated');
  } catch (error) { next(error); }
});

module.exports = router;
