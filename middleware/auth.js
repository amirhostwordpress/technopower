require('dotenv').config();
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = req.cookies && req.cookies.token ? req.cookies.token : null;
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_change_in_env';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired authentication token.'
    });
  }
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required before role check.'
    });
  }
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Super admin role required.'
    });
  }
  next();
}

module.exports = { authenticateJWT, requireSuperAdmin };
