const pool = require('../config/database.config');

// ─── Map numeric strings to JS numbers ────────────────────────────────────────
const mapRecord = (row) => {
  if (!row) return null;
  return {
    ...row,
    temp_celsius:     row.temp_celsius     != null ? parseFloat(row.temp_celsius)     : null,
    ot:               row.ot               != null ? parseFloat(row.ot)               : null,
    acidity_percent:  row.acidity_percent  != null ? parseFloat(row.acidity_percent)  : null,
    fat_percent:      row.fat_percent      != null ? parseFloat(row.fat_percent)      : null,
    clr:              row.clr              != null ? parseFloat(row.clr)              : null,
    snf_percent:      row.snf_percent      != null ? parseFloat(row.snf_percent)      : null,
    ph:               row.ph               != null ? parseFloat(row.ph)               : null,
  };
};

class MilkTakenReportBiProductRepository {
  // ─── findAll ──────────────────────────────────────────────────────────────
  async findAll(filters = {}) {
    let query = `
      SELECT r.*,
             u.full_name AS created_by_name
      FROM milk_taken_reports_bi_product r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.date) {
      query += ' AND r.date = ?';
      params.push(filters.date);
    }
    if (filters.date_from) {
      query += ' AND r.date >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ' AND r.date <= ?';
      params.push(filters.date_to);
    }
    if (filters.product_name) {
      query += ' AND r.product_name LIKE ?';
      params.push(`%${filters.product_name}%`);
    }

    query += ' ORDER BY r.date DESC, r.testing_time ASC, r.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const [rows] = await pool.query(query, params);
    return rows.map(mapRecord);
  }

  // ─── findById ─────────────────────────────────────────────────────────────
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              u.full_name AS created_by_name
       FROM milk_taken_reports_bi_product r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [id]
    );
    return mapRecord(rows[0]);
  }

  // ─── create ───────────────────────────────────────────────────────────────
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO milk_taken_reports_bi_product
       (date, product_name, testing_time, temp_celsius, ot, acidity_percent,
        alcohol_result, fat_percent, clr, snf_percent, neutralizer_adultration,
        sodium_electrolyte_condition, ph, chemist_name, qc_manager_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.product_name,
        data.testing_time                  || null,
        data.temp_celsius                  ?? null,
        data.ot                            ?? null,
        data.acidity_percent               ?? null,
        data.alcohol_result                || null,
        data.fat_percent                   ?? null,
        data.clr                           ?? null,
        data.snf_percent                   ?? null,
        data.neutralizer_adultration       || null,
        data.sodium_electrolyte_condition  || null,
        data.ph                            ?? null,
        data.chemist_name                  || null,
        data.qc_manager_name               || null,
        data.created_by                    || null,
      ]
    );
    return result.insertId;
  }

  // ─── update ───────────────────────────────────────────────────────────────
  async update(id, data) {
    const updatable = [
      'date', 'product_name', 'testing_time', 'temp_celsius', 'ot',
      'acidity_percent', 'alcohol_result', 'fat_percent', 'clr', 'snf_percent',
      'neutralizer_adultration', 'sodium_electrolyte_condition', 'ph',
      'chemist_name', 'qc_manager_name',
    ];
    const fields = [];
    const values = [];

    for (const field of updatable) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field] === '' ? null : data[field]);
      }
    }

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE milk_taken_reports_bi_product SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  // ─── delete ───────────────────────────────────────────────────────────────
  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM milk_taken_reports_bi_product WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = new MilkTakenReportBiProductRepository();
