const prisma = require('../config/database');

const findById = (id, include = undefined) =>
  prisma.user.findUnique({ where: { id }, ...(include ? { include } : {}) });

const findByMobile = (mobile, include = undefined) =>
  prisma.user.findUnique({ where: { mobile }, ...(include ? { include } : {}) });

const findByEmail = (email, include = undefined) =>
  prisma.user.findUnique({ where: { email }, ...(include ? { include } : {}) });

const findByEmailOrMobile = ({ email, mobile }, include = undefined) =>
  prisma.user.findFirst({
    where: {
      OR: [{ email: email || undefined }, { mobile: mobile || undefined }],
    },
    ...(include ? { include } : {}),
  });

const create = (data, include = undefined) =>
  prisma.user.create({ data, ...(include ? { include } : {}) });

const update = (id, data, include = undefined) =>
  prisma.user.update({ where: { id }, data, ...(include ? { include } : {}) });

const listPendingApprovals = (role) =>
  prisma.user.findMany({
    where: { role, approvalStatus: 'PENDING' },
    include: {
      doctorProfile: true,
      ownedClinics: true,
      adminProfile: true,
    },
    orderBy: { createdAt: 'asc' },
  });

module.exports = {
  findById,
  findByMobile,
  findByEmail,
  findByEmailOrMobile,
  create,
  update,
  listPendingApprovals,
};
