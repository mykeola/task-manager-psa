import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName, organizationSlug } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Registration requires name, email, and password.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    let organization;
    let role = 'admin';

    // Option A: Join existing organization by slug
    if (organizationSlug) {
      organization = await Organization.findOne({ slug: organizationSlug.toLowerCase() });
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: `Organization with slug '${organizationSlug}' does not exist.`
        });
      }
      role = 'member'; // Joining an existing organization assigns default member role
    } else if (organizationName) {
      // Option B: Self-service registration creates new Organization + initial Admin
      const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const existingOrg = await Organization.findOne({ slug });
      if (existingOrg) {
        return res.status(409).json({
          success: false,
          error: `An organization with the identifier '${slug}' already exists. Please pick a distinct name.`
        });
      }

      organization = await Organization.create({
        name: organizationName,
        slug
      });
      role = 'admin';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please provide either an organizationName (to create an org) or organizationSlug (to join an existing org).'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      organization: organization._id,
      memberships: [
        {
          organization: organization._id,
          role
        }
      ]
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await logAuditEvent({
      req,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: user._id,
      details: { role, organization: organization.name },
      organization: organization._id
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug
          },
          memberships: [
            {
              organization: {
                id: organization._id,
                name: organization.name,
                slug: organization.slug
              },
              role
            }
          ]
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Login requires both email and password as valid strings.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('organization')
      .populate('memberships.organization', 'name slug status plan');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials provided. User account not found.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials provided. Incorrect password.'
      });
    }

    // Check organization active status for non-superadmins
    if (user.role !== 'superadmin' && user.organization) {
      if (user.organization.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Your organization account is currently suspended. Please contact platform administration.'
        });
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await logAuditEvent({
      req,
      action: 'USER_LOGIN',
      targetType: 'Security',
      targetId: user._id,
      details: { role: user.role },
      organization: user.organization?._id || null
    });

    // Format memberships list
    const memberships = (user.memberships || [])
      .map((m) => {
        if (!m.organization) return null;
        return {
          organization: {
            id: m.organization._id || m.organization,
            name: m.organization.name || 'Organization',
            slug: m.organization.slug || ''
          },
          role: m.role
        };
      })
      .filter(Boolean);

    // Ensure active organization is in memberships
    if (user.organization && !memberships.some((m) => String(m.organization.id) === String(user.organization._id))) {
      memberships.unshift({
        organization: {
          id: user.organization._id,
          name: user.organization.name,
          slug: user.organization.slug
        },
        role: user.role
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization
            ? {
                id: user.organization._id,
                name: user.organization.name,
                slug: user.organization.slug,
                status: user.organization.status
              }
            : null,
          memberships
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required.'
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token. Please log in again.'
      });
    }

    const user = await User.findById(decoded.id).populate('organization');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User associated with refresh token no longer exists.'
      });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('organization')
      .populate('memberships.organization', 'name slug status plan');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found.'
      });
    }

    const memberships = (user.memberships || [])
      .map((m) => {
        if (!m.organization) return null;
        return {
          organization: {
            id: m.organization._id || m.organization,
            name: m.organization.name || 'Organization',
            slug: m.organization.slug || ''
          },
          role: m.role
        };
      })
      .filter(Boolean);

    if (user.organization && !memberships.some((m) => String(m.organization.id) === String(user.organization._id))) {
      memberships.unshift({
        organization: {
          id: user.organization._id,
          name: user.organization.name,
          slug: user.organization.slug
        },
        role: user.role
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        memberships
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Organization and switch to it as Admin
 */
export const createOrganization = async (req, res, next) => {
  try {
    const { organizationName } = req.body;
    if (!organizationName || typeof organizationName !== 'string' || !organizationName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Organization name is required.'
      });
    }

    const cleanName = organizationName.trim();
    let baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = 'org';

    // Handle slug uniqueness
    let slug = baseSlug;
    let counter = 1;
    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const organization = await Organization.create({
      name: cleanName,
      slug
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Initialize memberships if empty
    if (!user.memberships || user.memberships.length === 0) {
      if (user.organization) {
        user.memberships = [{ organization: user.organization, role: user.role }];
      } else {
        user.memberships = [];
      }
    }

    // Add new organization as admin
    user.memberships.push({
      organization: organization._id,
      role: 'admin'
    });

    // Switch active context to the new organization
    user.organization = organization._id;
    user.role = 'admin';
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await logAuditEvent({
      req,
      action: 'ORGANIZATION_CREATED',
      targetType: 'Organization',
      targetId: organization._id,
      details: { name: organization.name, createdBy: user.email },
      organization: organization._id
    });

    const populatedUser = await User.findById(user._id)
      .populate('organization')
      .populate('memberships.organization', 'name slug status plan');

    const memberships = (populatedUser.memberships || [])
      .map((m) => {
        if (!m.organization) return null;
        return {
          organization: {
            id: m.organization._id || m.organization,
            name: m.organization.name || 'Organization',
            slug: m.organization.slug || ''
          },
          role: m.role
        };
      })
      .filter(Boolean);

    res.status(201).json({
      success: true,
      message: `Organization '${organization.name}' successfully created. Switched to Admin context.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug
          },
          memberships
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Switch active organization context
 */
export const switchOrganization = async (req, res, next) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Target organizationId is required.'
      });
    }

    const user = await User.findById(req.user.id).populate('organization');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const targetOrg = await Organization.findById(organizationId);
    if (!targetOrg) {
      return res.status(404).json({
        success: false,
        error: 'Target organization does not exist.'
      });
    }

    if (targetOrg.status === 'suspended' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot switch to a suspended organization.'
      });
    }

    // Verify membership in target organization
    let targetRole = null;
    const membership = (user.memberships || []).find(
      (m) => String(m.organization) === String(organizationId) || String(m.organization?._id) === String(organizationId)
    );

    if (membership) {
      targetRole = membership.role;
    } else if (String(user.organization?._id || user.organization) === String(organizationId)) {
      targetRole = user.role;
    } else if (user.role === 'superadmin') {
      targetRole = 'superadmin';
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You are not a registered member of this organization.'
      });
    }

    // Switch active organization & role
    user.organization = targetOrg._id;
    if (user.role !== 'superadmin') {
      user.role = targetRole;
    }
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await logAuditEvent({
      req,
      action: 'ORGANIZATION_SWITCHED',
      targetType: 'Organization',
      targetId: targetOrg._id,
      details: { switchedTo: targetOrg.name, newRole: user.role },
      organization: targetOrg._id
    });

    const populatedUser = await User.findById(user._id)
      .populate('organization')
      .populate('memberships.organization', 'name slug status plan');

    const memberships = (populatedUser.memberships || [])
      .map((m) => {
        if (!m.organization) return null;
        return {
          organization: {
            id: m.organization._id || m.organization,
            name: m.organization.name || 'Organization',
            slug: m.organization.slug || ''
          },
          role: m.role
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      message: `Successfully switched workspace to ${targetOrg.name}.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: {
            id: targetOrg._id,
            name: targetOrg.name,
            slug: targetOrg.slug
          },
          memberships
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};
