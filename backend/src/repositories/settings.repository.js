const pool = require('../config/database.config');

class SettingsRepository {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM settings ORDER BY setting_key');
    return rows;
  }

  async findByKey(key) {
    const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key = ?', [key]);
    return rows[0] || null;
  }

  async upsert(key, value, updatedBy) {
    const [existing] = await pool.query('SELECT id FROM settings WHERE setting_key = ?', [key]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
        [value, updatedBy, key]
      );
    } else {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?)',
        [key, value, updatedBy]
      );
    }
    return await this.findByKey(key);
  }
}

module.exports = new SettingsRepository();
