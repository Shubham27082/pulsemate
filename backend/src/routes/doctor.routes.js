const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getTodayAppointments,
  getAppointments,
  startConsultation,
  completeConsultation,
  updateAvailability,
  getDoctorProfile,
  updateDoctorProfile,
} = require('../controllers/doctor.controller');

router.use(authenticate, authorize('DOCTOR', 'SUPER_ADMIN'));

router.get('/today', getTodayAppointments);
router.get('/appointments', getAppointments);
router.patch('/appointments/:id/start', startConsultation);
router.patch('/appointments/:id/complete', completeConsultation);
router.patch('/availability', updateAvailability);
router.get('/profile', getDoctorProfile);
router.patch('/profile', updateDoctorProfile);

module.exports = router;
