const express = require('express');
const router = express.Router();
const {
  authenticate,
  authorize,
  requireApprovalStatuses,
  requireClinicVerified,
} = require('../middleware/auth.middleware');
const {
  createClinic,
  getMyClinics,
  getClinic,
  updateClinic,
  addStaff,
  getStaff,
  getDoctorInvites,
  updateStaffStatus,
  getClinicRevenue,
  getClinicAppointments,
} = require('../controllers/clinic.controller');
const { validate, createClinicSchema, updateClinicSchema, addStaffSchema } = require('../validators/clinic.validator');

router.use(authenticate);

router.post('/', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'PATIENT'), validate(createClinicSchema), createClinic);
router.get('/my', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), getMyClinics);
router.get('/:id', getClinic);
router.patch('/:id', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), validate(updateClinicSchema), updateClinic);
router.post('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, validate(addStaffSchema), addStaff);
router.get('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'), getStaff);
router.get('/:id/doctor-invites', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getDoctorInvites);
router.patch('/:id/staff/:staffId/status', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, updateStaffStatus);
router.get('/:id/revenue', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getClinicRevenue);
router.get('/:id/appointments', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'), getClinicAppointments);

module.exports = router;
