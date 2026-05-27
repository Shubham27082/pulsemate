const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireAdminLevel } = require('../middleware/auth.middleware');
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
router.get('/clinics', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), getClinics);
router.patch('/clinics/:id/approve', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), approveClinic);
router.get('/users', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE'), getUsers);
router.post('/users', requireAdminLevel('ROOT', 'SUPER_ADMIN'), createStaffUser);
router.patch('/users/:id/status', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), updateUserStatus);

module.exports = router;
