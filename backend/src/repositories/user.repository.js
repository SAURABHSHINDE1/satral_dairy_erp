const pool = require('../config/database.config');

class UserRepository {
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async findAll(filters = {}) {
    let query = 'SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }

    query += ' ORDER BY created_at DESC';

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

  async create(userData) {
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [userData.username, userData.password, userData.email, userData.full_name, userData.role]
    );
    return result.insertId;
  }

  async update(id, userData) {
    const fields = [];
    const values = [];

    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }

    if (userData.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(userData.full_name);
    }

    if (userData.role !== undefined) {
      fields.push('role = ?');
      values.push(userData.role);
    }

    if (userData.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(userData.is_active);
    }

    if (userData.password !== undefined) {
      fields.push('password = ?');
      values.push(userData.password);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  async updateLastLogin(id) {
    const [result] = await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count;
  }
}

module.exports = new UserRepository();
