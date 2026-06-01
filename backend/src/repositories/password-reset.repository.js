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

const invalidateForUserByPurpose = (userId, purpose) =>
  prisma.passwordResetToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

const findByHash = (tokenHash) =>
  prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    include: { user: true },
  });

const markUsed = (id) =>
  prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });

module.exports = {
  create,
  findActiveByHash,
  findByHash,
  invalidateForUser,
  invalidateForUserByPurpose,
  markUsed,
};
