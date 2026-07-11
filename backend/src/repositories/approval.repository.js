const pool = require('../config/database.config');

class ApprovalRepository {
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT a.*, u.full_name as approver_name, u.role as approver_role
       FROM approvals a
       JOIN users u ON a.approver_id = u.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0];
  }

  async findByTankRecordId(tankRecordId) {
    const [rows] = await pool.query(
      `SELECT a.*, u.full_name as approver_name, u.role as approver_role
       FROM approvals a
       JOIN users u ON a.approver_id = u.id
       WHERE a.tank_record_id = ?
       ORDER BY a.approved_at DESC`,
      [tankRecordId]
    );
    return rows;
  }

  async create(approvalData) {
    const [result] = await pool.query(
      'INSERT INTO approvals (tank_record_id, approver_id, approver_role, action, comments) VALUES (?, ?, ?, ?, ?)',
      [approvalData.tank_record_id, approvalData.approver_id, approvalData.approver_role, approvalData.action, approvalData.comments || null]
    );
    return result.insertId;
  }

  async findAll(filters = {}) {
    let query = `
      SELECT a.*, u.full_name as approver_name, u.role as approver_role, tr.tank_number
      FROM approvals a
      JOIN users u ON a.approver_id = u.id
      JOIN tank_records tr ON a.tank_record_id = tr.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.tank_record_id) {
      query += ' AND a.tank_record_id = ?';
      params.push(filters.tank_record_id);
    }

    if (filters.approver_id) {
      query += ' AND a.approver_id = ?';
      params.push(filters.approver_id);
    }

    if (filters.action) {
      query += ' AND a.action = ?';
      params.push(filters.action);
    }

    query += ' ORDER BY a.approved_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }
}

module.exports = new ApprovalRepository();
