const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createClinic,
  getMyClinics,
  getClinic,
  updateClinic,
  addStaff,
  getStaff,
  updateStaffStatus,
  getClinicRevenue,
  getClinicAppointments,
} = require('../controllers/clinic.controller');
const { validate, createClinicSchema, updateClinicSchema, addStaffSchema } = require('../validators/clinic.validator');

router.use(authenticate);

router.post('/', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'PATIENT'), validate(createClinicSchema), createClinic);
router.get('/my', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), getMyClinics);
router.get('/:id', getClinic);
router.patch('/:id', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), validate(updateClinicSchema), updateClinic);
router.post('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), validate(addStaffSchema), addStaff);
router.get('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'), getStaff);
router.patch('/:id/staff/:staffId/status', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), updateStaffStatus);
router.get('/:id/revenue', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), getClinicRevenue);
router.get('/:id/appointments', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'), getClinicAppointments);

module.exports = router;
