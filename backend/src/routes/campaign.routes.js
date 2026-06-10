/**
 * Admin notification campaign routes.
 * Mounted at: /api/admin/notifications
 * Auth: authenticateUser + requireSuperAdmin applied in admin.routes.js
 */
const express = require('express');
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign,
} = require('../controllers/campaign.controller');
const { requireAdminLevel } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin notification routes require at least ROOT, SUPER_ADMIN, or SUPPORT level
const canManage = requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT');

router.post('/', canManage, createCampaign);
router.get('/', canManage, getCampaigns);
router.get('/:id', canManage, getCampaignById);
router.post('/:id/send', canManage, sendCampaign);
router.patch('/:id/pause', canManage, pauseCampaign);
router.patch('/:id/resume', canManage, resumeCampaign);
router.patch('/:id/stop', canManage, stopCampaign);
router.delete('/:id', canManage, deleteCampaign);

module.exports = router;
