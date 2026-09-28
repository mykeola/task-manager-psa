import { User } from '../models/User.js';
import { withTenantScope } from '../services/tenantQueryHelper.js';
import { logAuditEvent } from '../services/auditService.js';

export const getUsers = async (req, res, next) => {
  try {
    const filter = withTenantScope({}, req);
    const users = await User.find(filter)
      .select('-password')
      .populate('organization', 'name slug status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'member' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.'
      });
    }

    // Role safety check: Admins cannot create SuperAdmins
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Vertical escalation blocked. Only SuperAdmins can provision SuperAdmin accounts.'
      });
    }

    const organization = req.user.organization || req.body.organization;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      organization: role === 'superadmin' ? null : organization
    });

    await logAuditEvent({
      req,
      action: 'USER_CREATED_BY_ADMIN',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email, role: user.role }
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (error) {
    next(error);
  }
};
