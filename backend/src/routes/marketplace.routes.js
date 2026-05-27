const express = require('express');
const {
  listMarketplaceDoctors,
  inviteDoctorToClinic,
  listMyInvitations,
  respondToInvitation,
} = require('../controllers/marketplace.controller');
const {
  authenticate,
  requireRole,
  requireApprovalStatuses,
  requireDoctorVerified,
} = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/doctors', listMarketplaceDoctors);
router.get(
  '/invitations/my',
  authenticate,
  requireRole('DOCTOR'),
  requireApprovalStatuses('VERIFIED'),
  requireDoctorVerified,
  listMyInvitations
);
router.post(
  '/doctors/:doctorId/invite',
  authenticate,
  requireRole('CLINIC_OWNER'),
  requireApprovalStatuses('VERIFIED'),
  inviteDoctorToClinic
);
router.post(
  '/invitations/:inviteId/respond',
  authenticate,
  requireRole('DOCTOR'),
  requireApprovalStatuses('VERIFIED'),
  requireDoctorVerified,
  respondToInvitation
);

module.exports = router;
