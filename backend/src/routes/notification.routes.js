const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  registerFcmToken,
  removeFcmToken,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserCampaignNotifications,
  markCampaignNotificationRead,
  markAllCampaignNotificationsRead,
} = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/my', getMyNotifications);
router.post('/fcm-token', registerFcmToken);
router.delete('/fcm-token', removeFcmToken);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

// ── User in-app campaign notification routes (aliases for /api/user/notifications) ──
router.get('/inbox', getUserCampaignNotifications);
router.patch('/inbox/read-all', markAllCampaignNotificationsRead);
router.patch('/inbox/:id/read', markCampaignNotificationRead);

module.exports = router;
