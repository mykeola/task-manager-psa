import { AuditLog } from '../models/AuditLog.js';

/**
 * Tenant Scoping Middleware (Core Multi-Tenant Security Gatekeeper)
 * 
 * Invariant: No organization can ever view, query, or infer another organization's data.
 * 
 * 1. For non-superadmin users (admin, manager, member):
 *    - Injects req.tenantFilter = { organization: req.user.organization } derived strictly
 *      from the verified cryptographic JWT token, NEVER from client-supplied input.
 *    - Strips or blocks client-supplied organization identifiers in request body/query,
 *      eliminating Horizontal Privilege Escalation (IDOR) attacks.
 * 
 * 2. For superadmin:
 *    - Allows optional ?organizationId query or param for targeted tenant drill-down.
 *    - Every cross-tenant access is explicitly audit-logged to AuditLog with actor details.
 */
export const tenantScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required before applying tenant isolation scope.'
      });
    }

    const { role, id: userId } = req.user;
    let organization = req.user.organization;

    // Robustly sanitize organization ID to a 24-hex string, handling populated docs or legacy tokens
    if (organization) {
      if (typeof organization === 'object' && organization._id) {
        organization = organization._id.toString();
      } else {
        const orgStr = String(organization);
        const match = orgStr.match(/[0-9a-fA-F]{24}/);
        if (match) organization = match[0];
      }
      req.user.organization = organization;
    }

    // --- NON-SUPERADMIN ENFORCEMENT ---
    if (role !== 'superadmin') {
      if (!organization) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: User account has no associated organization context.'
        });
      }

      // Defense Against IDOR / Parameter Tampering:
      // If a malicious client tries to supply a foreign organization in the body or query,
      // detect and reject the attempt or enforce token tenancy strictly.
      const rawSupplied = req.body?.organization || req.body?.organizationId || req.query?.organizationId;
      let suppliedOrg = rawSupplied;
      if (suppliedOrg) {
        const match = String(suppliedOrg).match(/[0-9a-fA-F]{24}/);
        if (match) suppliedOrg = match[0];
      }

      if (suppliedOrg && suppliedOrg !== organization) {
        return res.status(403).json({
          success: false,
          error: 'Security Violation: Attempted cross-tenant IDOR access. You cannot specify an external organization ID.'
        });
      }

      // Hard override on body to ensure any created entities are bound to the token's organization
      if (req.body && typeof req.body === 'object') {
        req.body.organization = organization;
      }

      // Attach strict query filter
      req.tenantFilter = { organization: organization };
      return next();
    }

    // --- SUPERADMIN PLATFORM-WIDE & CROSS-TENANT AUDITING ---
    let targetOrgId = req.query?.organizationId || req.params?.orgId || req.body?.organizationId || null;
    if (targetOrgId) {
      const match = String(targetOrgId).match(/[0-9a-fA-F]{24}/);
      if (match) targetOrgId = match[0];
      req.tenantFilter = { organization: targetOrgId };
    } else {
      // Platform-wide view (no organization filter applied)
      req.tenantFilter = {};
    }

    // Audit Log: Every SuperAdmin data-access request is permanently recorded
    // Non-blocking async log write
    AuditLog.create({
      organization: targetOrgId || null,
      user: userId,
      action: targetOrgId ? 'SUPERADMIN_TENANT_DRILLDOWN' : 'SUPERADMIN_PLATFORM_QUERY',
      targetType: 'CrossTenantAccess',
      targetId: targetOrgId ? targetOrgId.toString() : 'PLATFORM_WIDE',
      details: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    }).catch((err) => {
      console.error('[AuditLog SuperAdmin Write Warning]', err.message);
    });

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Tenant scoping failure: ${error.message}`
    });
  }
};
