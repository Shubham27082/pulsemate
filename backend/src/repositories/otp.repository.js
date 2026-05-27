const prisma = require('../config/database');

const findRecentUnverified = (mobile, purpose, since) =>
  prisma.otpVerification.findFirst({
    where: {
      mobile,
      purpose,
      verifiedAt: null,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });

const invalidateOutstanding = (mobile, purpose) =>
  prisma.otpVerification.updateMany({
    where: { mobile, purpose, verifiedAt: null },
    data: { verifiedAt: new Date() },
  });

const create = (data) => prisma.otpVerification.create({ data });

const findLatestValid = (mobile, purpose) =>
  prisma.otpVerification.findFirst({
    where: {
      mobile,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

const update = (id, data) =>
  prisma.otpVerification.update({ where: { id }, data });

module.exports = {
  findRecentUnverified,
  invalidateOutstanding,
  create,
  findLatestValid,
  update,
};
