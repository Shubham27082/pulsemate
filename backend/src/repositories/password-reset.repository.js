const prisma = require('../config/database');

const create = (data) => prisma.passwordResetToken.create({ data });

const findActiveByHash = (tokenHash) =>
  prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

const invalidateForUser = (userId) =>
  prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

const markUsed = (id) =>
  prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });

module.exports = {
  create,
  findActiveByHash,
  invalidateForUser,
  markUsed,
};
