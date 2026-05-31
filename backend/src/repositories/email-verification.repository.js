const prisma = require('../config/database');

const findRecentActive = (email, purpose, since) =>
  prisma.emailVerification.findFirst({
    where: {
      email,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });

const invalidateOutstanding = (email, purpose) =>
  prisma.emailVerification.updateMany({
    where: {
      email,
      purpose,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

const create = (data) => prisma.emailVerification.create({ data });

const findLatestValid = (email, purpose) =>
  prisma.emailVerification.findFirst({
    where: {
      email,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

const findByHash = (tokenHash) =>
  prisma.emailVerification.findFirst({
    where: { tokenHash },
  });

const update = (id, data) => prisma.emailVerification.update({ where: { id }, data });

const findLatestVerified = (email, purpose) =>
  prisma.emailVerification.findFirst({
    where: {
      email,
      purpose,
      verifiedAt: { not: null },
    },
    orderBy: { verifiedAt: 'desc' },
  });

module.exports = {
  findRecentActive,
  invalidateOutstanding,
  create,
  findLatestValid,
  findByHash,
  update,
  findLatestVerified,
};
