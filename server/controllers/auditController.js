import { AuditLog } from '../models/AuditLog.js';
import { withTenantScope } from '../services/tenantQueryHelper.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const filter = withTenantScope({}, req);
    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .populate('organization', 'name slug')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
