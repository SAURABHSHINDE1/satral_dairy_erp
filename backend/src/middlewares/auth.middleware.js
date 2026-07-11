const { verifyAccessToken } = require('../config/jwt.config');
const logger = require('../utils/logger');
const pool = require('../config/database.config');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Get user from database
    const [users] = await pool.query(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: 'User account is deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
