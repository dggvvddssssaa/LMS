const jwt = require('jsonwebtoken');
const { normalizeRole, hasRole } = require('../utils/roles');
const { getJwtSecret } = require('../utils/jwtSecret');

exports.verifyToken = (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, getJwtSecret());
    verified.role = normalizeRole(verified.role);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid Token' });
  }
};

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !hasRole(req.user.role, ...roles)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You do not have the required role to access this resource.' 
      });
    }
    next();
  };
};
