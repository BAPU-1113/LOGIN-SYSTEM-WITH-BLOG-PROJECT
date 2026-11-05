/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts endpoint access to specific roles ('admin', 'chef', 'user')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required role: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
