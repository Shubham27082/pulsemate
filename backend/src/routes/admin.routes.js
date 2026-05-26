const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getDashboard,
  getClinics,
  approveClinic,
  getUsers,
  updateUserStatus,
  createStaffUser,
} = require('../controllers/admin.controller');

// All admin routes require SUPER_ADMIN role
router.use(authenticate, authorize('SUPER_ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/clinics', getClinics);
router.patch('/clinics/:id/approve', approveClinic);
router.get('/users', getUsers);
router.post('/users', createStaffUser);
router.patch('/users/:id/status', updateUserStatus);

module.exports = router;
