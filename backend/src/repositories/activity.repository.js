const pool = require('../config/database.config');

class ActivityRepository {
  async create(activityData) {
    const [result] = await pool.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [activityData.user_id, activityData.action, activityData.entity_type, activityData.entity_id, activityData.ip_address, activityData.user_agent, activityData.details]
    );
    return result.insertId;
  }

  async findAll(filters = {}) {
    let query = `
      SELECT al.*, u.username, u.full_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.action) {
      query += ' AND al.action = ?';
      params.push(filters.action);
    }

    if (filters.entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(filters.entity_type);
    }

    if (filters.date_from) {
      query += ' AND DATE(al.created_at) >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND DATE(al.created_at) <= ?';
      params.push(filters.date_to);
    }

    query += ' ORDER BY al.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM activity_logs WHERE 1=1';
    const params = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters.entity_type) {
      query += ' AND entity_type = ?';
      params.push(filters.entity_type);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count;
  }
}

module.exports = new ActivityRepository();
