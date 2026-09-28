import { AuditLog } from '../models/AuditLog.js';

export const logAuditEvent = async ({
  req,
  action,
  targetType,
  targetId = null,
  details = {},
  organization = null
}) => {
  try {
    const orgId = organization || (req?.user?.organization ? req.user.organization : null);
    const userId = req?.user?.id || req?.user?._id;

    if (!userId) return;

    await AuditLog.create({
      organization: orgId,
      user: userId,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : null,
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1'
    });
  } catch (error) {
    console.error('[AuditService Error] Failed to persist audit log:', error.message);
  }
};
