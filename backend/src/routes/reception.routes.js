const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getQueue,
  addWalkIn,
  addFollowUp,
  checkIn,
  callNext,
  skipPatient,
  completePatient,
  pauseQueue,
  resumeQueue,
} = require('../controllers/reception.controller');

router.use(authenticate, authorize('RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'));

router.get('/queue/:doctorId', getQueue);
router.post('/walk-in', addWalkIn);
router.post('/follow-up', addFollowUp);
router.patch('/queue/:queueItemId/check-in', checkIn);
router.patch('/queue/:queueId/call-next', callNext);
router.patch('/queue-item/:id/skip', skipPatient);
router.patch('/queue-item/:id/complete', completePatient);
router.patch('/queue/:queueId/pause', pauseQueue);
router.patch('/queue/:queueId/resume', resumeQueue);

module.exports = router;
