const {
  authorizeRoles,
  requireVerifiedAccount,
  requireVerifiedClinic,
  requireClinicOwner,
  requireDoctor,
  requireReceptionist,
  requireSuperAdmin,
} = require('./auth.middleware');

module.exports = {
  authorizeRoles,
  requireVerifiedAccount,
  requireVerifiedClinic,
  requireClinicOwner,
  requireDoctor,
  requireReceptionist,
  requireSuperAdmin,
};
