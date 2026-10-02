export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure the request is authenticated first
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if the user's role is within the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have the required permissions'
      });
    }

    next();
  };
};
