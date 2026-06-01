const prisma = require('../config/database');

const findRecentActive = (mobile, purpose, since) =>
  prisma.otpVerification.findFirst({
    where: {
      mobile,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });

const invalidateOutstanding = (mobile, purpose) =>
  prisma.otpVerification.updateMany({
    where: {
      mobile,
      purpose,
      isUsed: false,
    },
    data: {
      isUsed: true,
      verifiedAt: new Date(),
    },
  });

const create = (data) => prisma.otpVerification.create({ data });

const findLatestValid = (mobile, purpose) =>
  prisma.otpVerification.findFirst({
    where: {
      mobile,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

const update = (id, data) => prisma.otpVerification.update({ where: { id }, data });

module.exports = {
  findRecentActive,
  invalidateOutstanding,
  create,
  findLatestValid,
  update,
};
