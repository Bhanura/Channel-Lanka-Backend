/**
 * src/middleware/role.middleware.js
 * Role-based access control middleware factory.
 * Usage: requireRole('platform_admin') or requireRole(['doctor', 'center_admin'])
 */

/**
 * Middleware factory: requireRole
 * @param {string|string[]} roles - Allowed role(s)
 * @returns Express middleware that rejects requests from unauthorized roles
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
