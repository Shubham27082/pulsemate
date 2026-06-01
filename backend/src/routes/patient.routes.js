const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  searchDoctors,
  getDoctorProfile,
  bookAppointment,
  getMyAppointments,
  getAppointmentDetails,
  getLiveQueue,
  cancelAppointment,
  getProfile,
  updateProfile,
} = require('../controllers/patient.controller');
const { validate, bookAppointmentSchema } = require('../validators/appointment.validator');

// Public routes (no auth needed for doctor search)
router.get('/doctors', searchDoctors);
router.get('/doctors/:id', getDoctorProfile);

// Protected patient routes — also allow DOCTOR role to use patient features for themselves
router.use(authenticate);

router.post('/appointments', authorize('PATIENT', 'DOCTOR'), validate(bookAppointmentSchema), bookAppointment);
router.get('/appointments',  authorize('PATIENT', 'DOCTOR'), getMyAppointments);
router.get('/appointments/:id', authorize('PATIENT', 'DOCTOR'), getAppointmentDetails);
router.get('/queue/:appointmentId', authorize('PATIENT', 'DOCTOR'), getLiveQueue);
router.patch('/appointments/:id/cancel', authorize('PATIENT', 'DOCTOR'), cancelAppointment);
router.get('/profile',  authorize('PATIENT', 'DOCTOR'), getProfile);
router.patch('/profile', authorize('PATIENT', 'DOCTOR'), updateProfile);

module.exports = router;
