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
  requestClinicChanges,
  suspendClinic,
  getAllClinics,
  getClinicStats,
  getClinicDetail,
} = require('../controllers/admin.controller');
const { authenticateUser, requireSuperAdmin, requireAdminLevel } = require('../middleware/auth.middleware');
const { approvalSchema, adminCreateSchema, validateRequest } = require('../validations/auth.validation');
const campaignRoutes = require('./campaign.routes');

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

// ── Clinic management ──────────────────────────────────────────────────────
router.get('/all-clinics/stats', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), getClinicStats);
router.get('/all-clinics', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), getAllClinics);
router.get('/all-clinics/:clinicId', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), getClinicDetail);
router.patch('/clinics/:clinicId/approve', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), approveClinic);
router.patch('/clinics/:clinicId/reject', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), rejectClinic);
router.patch('/clinics/:clinicId/request-changes', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), requestClinicChanges);
router.patch('/clinics/:clinicId/suspend', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), suspendClinic);

// ── Doctor management ──────────────────────────────────────────────────────
router.patch('/doctors/:doctorId/approve', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), approveDoctor);
router.patch('/doctors/:doctorId/reject', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), validateRequest(approvalSchema), rejectDoctor);

// ── Notification Campaigns ─────────────────────────────────────────────────
router.use('/notifications', campaignRoutes);

module.exports = router;
