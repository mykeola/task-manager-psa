/**
 * Repository-Layer Tenant Safety Net: withTenantScope
 * 
 * DEFENSE-IN-DEPTH ARCHITECTURAL CONTROL:
 * Even with middleware/tenantScope.js injecting req.tenantFilter, human error can lead
 * a developer to write a raw query like `Task.findById(id)` without scoping to the tenant.
 * 
 * This repository helper guarantees that:
 * 1. An organization filter is merged into every query object.
 * 2. If a non-superadmin request somehow arrives without a valid req.tenantFilter,
 *    this function throws an explicit security exception rather than executing an unscoped query.
 * 
 * Usage:
 *   const filter = withTenantScope({ _id: taskId }, req);
 *   const task = await Task.findOne(filter);
 */
export const withTenantScope = (baseQuery = {}, req) => {
  if (!req || !req.user) {
    throw new Error('[Security Exception] withTenantScope invoked without authenticated request context.');
  }

  const { role } = req.user;

  // For non-superadmin, tenant filter is strictly mandatory
  if (role !== 'superadmin') {
    if (!req.tenantFilter || !req.tenantFilter.organization) {
      throw new Error(
        `[Security Boundary Breach] Non-superadmin user (${req.user.id}) attempted data query without tenantFilter.`
      );
    }
    return {
      ...baseQuery,
      organization: req.tenantFilter.organization
    };
  }

  // For SuperAdmin, apply target organization if selected, otherwise allow platform-wide query
  if (req.tenantFilter && req.tenantFilter.organization) {
    return {
      ...baseQuery,
      organization: req.tenantFilter.organization
    };
  }

  return { ...baseQuery };
};
