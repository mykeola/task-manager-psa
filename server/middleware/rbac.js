/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies if the authenticated user has one of the permissible roles.
 * Prevents vertical privilege escalation (e.g. member calling admin endpoints).
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted. Required roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`
      });
    }

    next();
  };
};
