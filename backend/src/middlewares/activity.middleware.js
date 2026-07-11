const pool = require('../config/database.config');

const logActivity = async (userId, action, entityType, entityId = null, details = null) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, details, null, null]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

const activityLogger = (action, entityType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = async function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = req.params.id || req.body.id || null;
        await logActivity(
          req.user.id,
          action,
          entityType,
          entityId,
          JSON.stringify(req.body)
        );
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = { logActivity, activityLogger };
