const pool = require('../config/database.config');

class ButtermilkAnalysisRecordRepository {
  async findAll(filters = {}) {
    let query = `
      SELECT r.*,
             u.full_name AS created_by_name
      FROM buttermilk_analysis_records r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.date) {
      query += ' AND r.date = ?';
      params.push(filters.date);
    }

    query += ' ORDER BY r.date DESC, r.testing_time ASC, r.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              u.full_name AS created_by_name
       FROM buttermilk_analysis_records r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO buttermilk_analysis_records
       (date, shift, type_of_sample, testing_time, batch_no, packing_date, expiry_date,
        flavour, taste, fat_percent, degree, acidity_percent, protein_percent,
        adulteration, remark, sign_name, chemist_name, quality_incharge_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.shift,
        data.type_of_sample,
        data.testing_time,
        data.batch_no,
        data.packing_date,
        data.expiry_date,
        data.flavour,
        data.taste,
        data.fat_percent,
        data.degree,
        data.acidity_percent,
        data.protein_percent,
        data.adulteration,
        data.remark,
        data.sign_name,
        data.chemist_name,
        data.quality_incharge_name,
        data.created_by
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    const updatable = [
      'date', 'shift', 'type_of_sample', 'testing_time', 'batch_no', 'packing_date', 'expiry_date',
      'flavour', 'taste', 'fat_percent', 'degree', 'acidity_percent', 'protein_percent',
      'adulteration', 'remark', 'sign_name', 'chemist_name', 'quality_incharge_name'
    ];
    const fields = [];
    const values = [];

    for (const field of updatable) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE buttermilk_analysis_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }
}

module.exports = new ButtermilkAnalysisRecordRepository();
