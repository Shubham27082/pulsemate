const prisma = require('../config/database');

const create = (data) => prisma.refreshToken.create({ data });

const findActiveByHash = (tokenHash) =>
  prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          adminProfile: true,
          doctorProfile: true,
          receptionistProfile: true,
          ownedClinics: true,
        },
      },
    },
  });

const findById = (id) => prisma.refreshToken.findUnique({ where: { id } });

const revokeById = (id, data = {}) =>
  prisma.refreshToken.update({
    where: { id },
    data: {
      revokedAt: data.revokedAt || new Date(),
      replacedByToken: data.replacedByToken || undefined,
    },
  });

const revokeByHash = (tokenHash) =>
  prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

const revokeAllForUser = (userId) =>
  prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

const listActiveForUser = (userId) =>
  prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

module.exports = {
  create,
  findActiveByHash,
  findById,
  revokeById,
  revokeByHash,
  revokeAllForUser,
  listActiveForUser,
};
