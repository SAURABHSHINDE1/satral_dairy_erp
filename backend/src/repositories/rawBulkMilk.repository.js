const pool = require('../config/database.config');

const mapRecord = (row) => {
  if (!row) return null;
  return {
    ...row,
    milk_quantity_lit:             row.milk_quantity_lit             != null ? parseFloat(row.milk_quantity_lit)             : null,
    temp_celsius:                  row.temp_celsius                  != null ? parseFloat(row.temp_celsius)                  : null,
    ot:                            row.ot                            != null ? parseFloat(row.ot)                            : null,
    acidity_percent:               row.acidity_percent               != null ? parseFloat(row.acidity_percent)               : null,
    fat_percent:                   row.fat_percent                   != null ? parseFloat(row.fat_percent)                   : null,
    clr:                           row.clr                           != null ? parseFloat(row.clr)                           : null,
    snf:                           row.snf                           != null ? parseFloat(row.snf)                           : null,
    protein_percent:               row.protein_percent               != null ? parseFloat(row.protein_percent)               : null,
    ph:                            row.ph                            != null ? parseFloat(row.ph)                            : null,
  };
};

class RawBulkMilkRepository {
  async findAll(filters = {}) {
    let query = `
      SELECT r.*,
             u.full_name  AS created_by_name,
             ab.full_name AS approved_by_name
      FROM raw_bulk_milk_testing_records r
      LEFT JOIN users u  ON r.created_by  = u.id
      LEFT JOIN users ab ON r.approved_by = ab.id
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
    if (filters.sample_name) {
      query += ' AND r.sample_name LIKE ?';
      params.push(`%${filters.sample_name}%`);
    }

    if (filters.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
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

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              u.full_name  AS created_by_name,
              ab.full_name AS approved_by_name
       FROM raw_bulk_milk_testing_records r
       LEFT JOIN users u  ON r.created_by  = u.id
       LEFT JOIN users ab ON r.approved_by = ab.id
       WHERE r.id = ?`,
      [id]
    );
    return mapRecord(rows[0]);
  }

  async approve(id, { status, approved_by, approval_comment }) {
    const [result] = await pool.query(
      `UPDATE raw_bulk_milk_testing_records
       SET status = ?, approved_by = ?, approved_at = NOW(), approval_comment = ?
       WHERE id = ?`,
      [status, approved_by, approval_comment || null, id]
    );
    return result.affectedRows;
  }

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO raw_bulk_milk_testing_records
       (date, testing_time, sample_name, type_of_milk, milk_quantity_lit,
        temp_celsius, ot, acidity_percent, alcohol_result, fat_percent,
        clr, snf, protein_percent, sodium_electrolyte_condition, ph,
        chemist_name, quality_incharge_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.testing_time               || null,
        data.sample_name,
        data.type_of_milk,
        data.milk_quantity_lit          ?? null,
        data.temp_celsius               ?? null,
        data.ot                         ?? null,
        data.acidity_percent            ?? null,
        data.alcohol_result             || null,
        data.fat_percent                ?? null,
        data.clr                        ?? null,
        data.snf                        ?? null,
        data.protein_percent            ?? null,
        data.sodium_electrolyte_condition || null,
        data.ph                         ?? null,
        data.chemist_name               || null,
        data.quality_incharge_name      || null,
        data.created_by                 || null,
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    const updatable = [
      'date', 'testing_time', 'sample_name', 'type_of_milk', 'milk_quantity_lit',
      'temp_celsius', 'ot', 'acidity_percent', 'alcohol_result', 'fat_percent',
      'clr', 'snf', 'protein_percent', 'sodium_electrolyte_condition', 'ph',
      'chemist_name', 'quality_incharge_name',
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
      `UPDATE raw_bulk_milk_testing_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM raw_bulk_milk_testing_records WHERE id = ?', [id]
    );
    return result.affectedRows;
  }
}

module.exports = new RawBulkMilkRepository();
