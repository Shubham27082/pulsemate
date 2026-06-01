const prisma = require('../config/database');

const create = (data) => prisma.session.create({ data });

const findActiveByHash = (refreshTokenHash, authRole) =>
  prisma.session.findFirst({
    where: {
      refreshTokenHash,
      authRole,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          adminProfile: true,
          doctorProfile: true,
          receptionistProfile: true,
        },
      },
    },
  });

const update = (id, data) =>
  prisma.session.update({ where: { id }, data });

const revokeById = (id) =>
  prisma.session.update({ where: { id }, data: { isRevoked: true } });

const revokeByHash = (refreshTokenHash, authRole) =>
  prisma.session.updateMany({
    where: { refreshTokenHash, authRole, isRevoked: false },
    data: { isRevoked: true },
  });

const revokeAllForUser = (userId) =>
  prisma.session.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });

const revokeAllForRole = (userId, authRole) =>
  prisma.session.updateMany({
    where: { userId, authRole, isRevoked: false },
    data: { isRevoked: true },
  });

const listForUser = (userId) =>
  prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

module.exports = {
  create,
  findActiveByHash,
  update,
  revokeById,
  revokeByHash,
  revokeAllForUser,
  revokeAllForRole,
  listForUser,
};
