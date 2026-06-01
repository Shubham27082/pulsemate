const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  initiatePayment,
  verifyPayment,
  markCashPayment,
  getPaymentStatus,
  getMyPayments,
} = require('../controllers/payment.controller');

router.use(authenticate);

// Patient routes — also allow DOCTOR role to book for themselves
router.post('/initiate', authorize('PATIENT', 'DOCTOR'), initiatePayment);
router.post('/verify',   authorize('PATIENT', 'DOCTOR'), verifyPayment);
router.get('/my',        authorize('PATIENT', 'DOCTOR'), getMyPayments);

// Staff routes
router.post('/cash', authorize('RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'), markCashPayment);

// Shared
router.get('/appointment/:appointmentId',
  authorize('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'),
  getPaymentStatus
);

module.exports = router;
