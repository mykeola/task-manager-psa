import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { logAuditEvent } from '../services/auditService.js';

export const getOrganizations = async (req, res, next) => {
  try {
    const { role, organization } = req.user;

    // SuperAdmin: Full platform-wide organization list with metrics
    if (role === 'superadmin') {
      const orgs = await Organization.find().sort({ createdAt: -1 });

      const enrichedOrgs = await Promise.all(
        orgs.map(async (org) => {
          const userCount = await User.countDocuments({ organization: org._id });
          const projectCount = await Project.countDocuments({ organization: org._id });
          return {
            ...org.toObject(),
            userCount,
            projectCount
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: enrichedOrgs.length,
        data: enrichedOrgs
      });
    }

    // Non-SuperAdmin: Strictly scoped to their own organization
    const org = await Organization.findById(organization);
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization record not found.'
      });
    }

    const userCount = await User.countDocuments({ organization: org._id });
    const projectCount = await Project.countDocuments({ organization: org._id });

    return res.status(200).json({
      success: true,
      count: 1,
      data: [{ ...org.toObject(), userCount, projectCount }]
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, organization } = req.user;

    // Non-superadmin can only query their own organization
    if (role !== 'superadmin' && organization.toString() !== id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Access restricted. You cannot access another organization details.'
      });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({
        success: false,
        error: `Organization with ID '${id}' was not found.`
      });
    }

    const userCount = await User.countDocuments({ organization: org._id });
    const projectCount = await Project.countDocuments({ organization: org._id });

    res.status(200).json({
      success: true,
      data: { ...org.toObject(), userCount, projectCount }
    });
  } catch (error) {
    next(error);
  }
};

export const createOrganization = async (req, res, next) => {
  try {
    const { name, plan = 'enterprise' } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Organization name is required.'
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const existing = await Organization.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `An organization with slug '${slug}' already exists.`
      });
    }

    const org = await Organization.create({ name, slug, plan });

    await logAuditEvent({
      req,
      action: 'ORGANIZATION_CREATED',
      targetType: 'Organization',
      targetId: org._id,
      details: { name: org.name, slug: org.slug, plan: org.plan },
      organization: org._id
    });

    res.status(201).json({
      success: true,
      data: org
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be either 'active' or 'suspended'."
      });
    }

    const org = await Organization.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!org) {
      return res.status(404).json({
        success: false,
        error: `Organization '${id}' not found.`
      });
    }

    await logAuditEvent({
      req,
      action: `ORGANIZATION_STATUS_${status.toUpperCase()}`,
      targetType: 'Organization',
      targetId: org._id,
      details: { newStatus: status },
      organization: org._id
    });

    res.status(200).json({
      success: true,
      data: org
    });
  } catch (error) {
    next(error);
  }
};
