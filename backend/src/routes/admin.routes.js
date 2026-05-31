const express = require('express');
const {
  getDashboard,
  getPendingClinics,
  getPendingDoctors,
  approveClinic,
  rejectClinic,
  approveDoctor,
  rejectDoctor,
  getUsers,
  updateUserStatus,
  createAdminAccount,
  deleteAdminAccount,
  resetDatabase,
} = require('../controllers/admin.controller');
const { authenticateUser, requireSuperAdmin, requireAdminLevel } = require('../middleware/auth.middleware');
const { approvalSchema, adminCreateSchema, validateRequest } = require('../validations/auth.validation');

const router = express.Router();

router.use(authenticateUser, requireSuperAdmin);

router.get('/dashboard', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE'), getDashboard);
router.get('/users', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE'), getUsers);
router.post('/admins', requireAdminLevel('ROOT'), validateRequest(adminCreateSchema), createAdminAccount);
router.delete('/admins/:id', requireAdminLevel('ROOT'), deleteAdminAccount);
router.get('/pending-clinics', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), getPendingClinics);
router.get('/pending-doctors', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), getPendingDoctors);
router.patch('/users/:id/status', requireAdminLevel('ROOT', 'SUPER_ADMIN'), updateUserStatus);
router.post('/reset-database', requireAdminLevel('ROOT'), resetDatabase);
router.patch('/clinics/:clinicId/approve', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), approveClinic);
router.patch('/clinics/:clinicId/reject', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), validateRequest(approvalSchema), rejectClinic);
router.patch('/doctors/:doctorId/approve', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), approveDoctor);
router.patch('/doctors/:doctorId/reject', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), validateRequest(approvalSchema), rejectDoctor);

module.exports = router;
