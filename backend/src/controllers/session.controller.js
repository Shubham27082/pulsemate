const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');

const listSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { sessions });
  } catch (error) {
    next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!session) return sendError(res, 'Session not found', 404);

    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'SESSION_REVOKED',
      entityType: 'Session',
      entityId: sessionId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'Session revoked successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSessions,
  revokeSession,
};
