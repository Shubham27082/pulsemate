const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Create an audit log entry
 */
const createAuditLog = async ({ userId, action, entityType, entityId, metadata, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    // Audit log failure should not break the main flow
    logger.error('Failed to create audit log', { error: error.message, action });
  }
};

module.exports = { createAuditLog };
