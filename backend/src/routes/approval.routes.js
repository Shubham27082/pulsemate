const express = require('express');
const {
  listPendingClinics,
  listPendingDoctors,
  decideClinicApproval,
  decideDoctorApproval,
} = require('../controllers/approval.controller');
const { authenticate, requireRole, requireAdminLevel } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, requireRole('SUPER_ADMIN'), requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'));

router.get('/clinics/pending', listPendingClinics);
router.get('/doctors/pending', listPendingDoctors);
router.patch('/clinics/:clinicId', decideClinicApproval);
router.patch('/doctors/:doctorUserId', decideDoctorApproval);

module.exports = router;
