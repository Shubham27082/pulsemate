/**
 * Admin Notification Campaign controller.
 * Routes: /api/admin/notifications/*
 */
const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { sendPushToUsers } = require('../services/pushNotification.service');
const logger = require('../config/logger');

// ── helpers ───────────────────────────────────────────────────────────────────
const DELETABLE_STATUSES = ['DRAFT', 'PAUSED', 'STOPPED', 'FAILED'];
const NON_SENDABLE_STATUSES = ['STOPPED', 'SENT', 'SENDING'];

/**
 * Resolve the list of target userIds for a campaign.
 */
const resolveTargetUserIds = async (campaign) => {
  const { targetType, targetCity, targetState, targetUserIds } = campaign;

  if (targetType === 'SELECTED_USERS') {
    return targetUserIds || [];
  }

  const where = { isActive: true };

  if (targetType === 'CITY') {
    where.patientProfile = { city: { equals: targetCity, mode: 'insensitive' } };
  } else if (targetType === 'STATE') {
    where.patientProfile = { state: { equals: targetState, mode: 'insensitive' } };
  }
  // ALL_USERS — no extra filter

  const users = await prisma.user.findMany({ where, select: { id: true } });
  return users.map((u) => u.id);
};

// ── POST /api/admin/notifications ─────────────────────────────────────────────
const createCampaign = async (req, res, next) => {
  try {
    const {
      title,
      message,
      channel = 'IN_APP',
      targetType = 'ALL_USERS',
      targetCity,
      targetState,
      targetUserIds = [],
      scheduledAt,
    } = req.body;

    if (!title?.trim()) return sendError(res, 'Title is required', 400);
    if (!message?.trim()) return sendError(res, 'Message is required', 400);

    const validChannels = ['PUSH', 'IN_APP', 'PUSH_AND_IN_APP'];
    const validTargets = ['ALL_USERS', 'SELECTED_USERS', 'CITY', 'STATE'];
    if (!validChannels.includes(channel)) return sendError(res, `Invalid channel. Must be one of: ${validChannels.join(', ')}`, 400);
    if (!validTargets.includes(targetType)) return sendError(res, `Invalid targetType. Must be one of: ${validTargets.join(', ')}`, 400);

    if (targetType === 'CITY' && !targetCity?.trim()) return sendError(res, 'targetCity is required when targetType is CITY', 400);
    if (targetType === 'STATE' && !targetState?.trim()) return sendError(res, 'targetState is required when targetType is STATE', 400);
    if (targetType === 'SELECTED_USERS' && (!Array.isArray(targetUserIds) || targetUserIds.length === 0)) {
      return sendError(res, 'targetUserIds must be a non-empty array when targetType is SELECTED_USERS', 400);
    }

    const campaign = await prisma.notificationCampaign.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        channel,
        targetType,
        targetCity: targetCity?.trim() || null,
        targetState: targetState?.trim() || null,
        targetUserIds: targetType === 'SELECTED_USERS' ? targetUserIds : [],
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdByAdminId: req.user?.id || null,
      },
    });

    return sendSuccess(res, { campaign }, 'Campaign created successfully', 201);
  } catch (error) { next(error); }
};

// ── GET /api/admin/notifications ──────────────────────────────────────────────
const getCampaigns = async (req, res, next) => {
  try {
    const {
      status,
      channel,
      targetType,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (targetType) where.targetType = targetType;
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { message: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [campaigns, total, stats] = await Promise.all([
      prisma.notificationCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          _count: { select: { userNotifications: true } },
        },
      }),
      prisma.notificationCampaign.count({ where }),
      prisma.notificationCampaign.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const statMap = { DRAFT: 0, SCHEDULED: 0, SENDING: 0, SENT: 0, PAUSED: 0, STOPPED: 0, FAILED: 0 };
    for (const s of stats) statMap[s.status] = s._count.status;

    return sendPaginated(res, { campaigns, stats: statMap }, total, pageNum, limitNum);
  } catch (error) { next(error); }
};

// ── GET /api/admin/notifications/:id ─────────────────────────────────────────
const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.notificationCampaign.findUnique({
      where: { id },
      include: {
        _count: { select: { userNotifications: true } },
      },
    });
    if (!campaign) return sendError(res, 'Campaign not found', 404);
    return sendSuccess(res, { campaign, deliveryCount: campaign._count.userNotifications });
  } catch (error) { next(error); }
};

// ── POST /api/admin/notifications/:id/send ────────────────────────────────────
const sendCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.notificationCampaign.findUnique({ where: { id } });
    if (!campaign) return sendError(res, 'Campaign not found', 404);
    if (NON_SENDABLE_STATUSES.includes(campaign.status)) {
      return sendError(res, `Campaign cannot be sent when status is ${campaign.status}`, 400);
    }

    // Set status to SENDING
    await prisma.notificationCampaign.update({ where: { id }, data: { status: 'SENDING' } });

    let finalStatus = 'SENT';

    try {
      const userIds = await resolveTargetUserIds(campaign);

      if (userIds.length === 0) {
        await prisma.notificationCampaign.update({
          where: { id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        return sendSuccess(res, { sent: 0 }, 'Campaign sent (no matching users found)');
      }

      // Create in-app UserNotification rows if channel includes IN_APP
      if (campaign.channel === 'IN_APP' || campaign.channel === 'PUSH_AND_IN_APP') {
        await prisma.userNotification.createMany({
          data: userIds.map((userId) => ({
            userId,
            campaignId: id,
            title: campaign.title,
            message: campaign.message,
            channel: campaign.channel,
            sentAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }

      // Send push notifications if channel includes PUSH
      if (campaign.channel === 'PUSH' || campaign.channel === 'PUSH_AND_IN_APP') {
        await sendPushToUsers(userIds, campaign.title, campaign.message, {
          campaignId: id,
          type: 'CAMPAIGN',
        });
      }

      await prisma.notificationCampaign.update({
        where: { id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      return sendSuccess(res, { sent: userIds.length }, `Campaign sent to ${userIds.length} users`);
    } catch (innerError) {
      finalStatus = 'FAILED';
      logger.error(`Campaign send failed for ${id}:`, innerError.message);
      await prisma.notificationCampaign.update({
        where: { id },
        data: { status: 'FAILED' },
      }).catch(() => { });
      throw innerError;
    }
  } catch (error) { next(error); }
};

// ── PATCH /api/admin/notifications/:id/pause ─────────────────────────────────
const pauseCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.notificationCampaign.findUnique({ where: { id } });
    if (!campaign) return sendError(res, 'Campaign not found', 404);
    if (!['SCHEDULED', 'DRAFT'].includes(campaign.status)) {
      return sendError(res, `Cannot pause a campaign with status ${campaign.status}`, 400);
    }
    const updated = await prisma.notificationCampaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
    return sendSuccess(res, { campaign: updated }, 'Campaign paused');
  } catch (error) { next(error); }
};

// ── PATCH /api/admin/notifications/:id/resume ────────────────────────────────
const resumeCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.notificationCampaign.findUnique({ where: { id } });
    if (!campaign) return sendError(res, 'Campaign not found', 404);
    if (campaign.status !== 'PAUSED') {
      return sendError(res, `Cannot resume a campaign with status ${campaign.status}`, 400);
    }
    const newStatus = campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()
      ? 'SCHEDULED'
      : 'DRAFT';
    const updated = await prisma.notificationCampaign.update({
      where: { id },
      data: { status: newStatus },
    });
    return sendSuccess(res, { campaign: updated }, 'Campaign resumed');
  } catch (error) { next(error); }
};

// ── PATCH /api/admin/notifications/:id/stop ──────────────────────────────────
const stopCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.notificationCampaign.findUnique({ where: { id } });
    if (!campaign) return sendError(res, 'Campaign not found', 404);
    if (campaign.status === 'STOPPED') {
      return sendError(res, 'Campaign is already stopped', 400);
    }
    const updated = await prisma.notificationCampaign.update({
      where: { id },
      data: { status: 'STOPPED', stoppedAt: new Date() },
    });
    return sendSuccess(res, { campaign: updated }, 'Campaign stopped');
  } catch (error) { next(error); }
};

// ── DELETE /api/admin/notifications/:id ──────────────────────────────────────
const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.notificationCampaign.findUnique({ where: { id } });
    if (!campaign) return sendError(res, 'Campaign not found', 404);
    if (!DELETABLE_STATUSES.includes(campaign.status)) {
      return sendError(res, 'Sent campaigns cannot be deleted.', 400);
    }
    // Delete child UserNotification rows first
    await prisma.userNotification.deleteMany({ where: { campaignId: id } });
    await prisma.notificationCampaign.delete({ where: { id } });
    return sendSuccess(res, {}, 'Campaign deleted successfully');
  } catch (error) { next(error); }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign,
};
