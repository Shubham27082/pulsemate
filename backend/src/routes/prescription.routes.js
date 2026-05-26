const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createPrescription,
  getPrescription,
  getPrescriptionByAppointment,
  getMyPrescriptions,
  updatePrescription,
} = require('../controllers/prescription.controller');

router.use(authenticate);

// Doctor routes
router.post('/', authorize('DOCTOR'), createPrescription);
router.patch('/:id', authorize('DOCTOR'), updatePrescription);

// Shared routes (patient + doctor + staff)
router.get('/my', authorize('PATIENT', 'DOCTOR'), getMyPrescriptions);
router.get('/appointment/:appointmentId', authorize('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'), getPrescriptionByAppointment);
router.get('/:id', authorize('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'), getPrescription);

module.exports = router;
