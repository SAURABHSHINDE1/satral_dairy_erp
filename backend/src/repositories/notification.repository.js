const pool = require('../config/database.config');

class NotificationRepository {
  async create(notificationData) {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
      [notificationData.user_id, notificationData.title, notificationData.message, notificationData.type, notificationData.entity_type, notificationData.entity_id]
    );
    return result.insertId;
  }

  async findByUserId(userId, filters = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (filters.is_read !== undefined) {
      query += ' AND is_read = ?';
      params.push(filters.is_read);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async markAsRead(id, userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows;
  }

  async markAllAsRead(userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows;
  }

  async countUnread(userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  }
}

module.exports = new NotificationRepository();
