/**
 * buttermilkAnalysisRecord.repository.js
 *
 * Pattern: uses shared paginate() helper → returns { data, total, page, totalPages }.
 * Future modules should copy this findAll() pattern.
 */

const pool              = require('../config/database.config');
const { paginate }      = require('../utils/pagination.helper');

// ─── Standard columns to select (no SELECT *) ─────────────────────────────────
const SELECT_COLS = `
  r.id, r.date, r.shift, r.type_of_sample, r.testing_time,
  r.batch_no, r.packing_date, r.expiry_date,
  r.flavour, r.taste, r.fat_percent, r.degree,
  r.acidity_percent, r.protein_percent, r.adulteration,
  r.remark, r.sign_name, r.chemist_name, r.quality_incharge_name,
  r.created_at, r.created_by,
  u.full_name AS created_by_name
`.trim();

const FROM_JOINS = `
  FROM buttermilk_analysis_records r
  LEFT JOIN users u ON r.created_by = u.id
`.trim();

class ButtermilkAnalysisRecordRepository {
  /**
   * List records with pagination.
   * @param {Object} filters - { date?, page?, limit? }
   * @returns {{ data, total, page, totalPages }}
   */
  async findAll(filters = {}) {
    const where  = [];
    const params = [];

    if (filters.date) {
      where.push('r.date = ?');
      params.push(filters.date);
    }
    if (filters.shift) {
      where.push('r.shift = ?');
      params.push(filters.shift);
    }

    return paginate({
      pool,
      select : SELECT_COLS,
      from   : FROM_JOINS,
      where,
      params,
      orderBy: 'ORDER BY r.date DESC, r.testing_time ASC, r.created_at DESC',
      page   : filters.page,
      limit  : filters.limit,
    });
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${SELECT_COLS} ${FROM_JOINS} WHERE r.id = ?`,
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
        data.date, data.shift, data.type_of_sample, data.testing_time, data.batch_no,
        data.packing_date, data.expiry_date, data.flavour, data.taste,
        data.fat_percent, data.degree, data.acidity_percent, data.protein_percent,
        data.adulteration, data.remark, data.sign_name, data.chemist_name,
        data.quality_incharge_name, data.created_by,
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    const updatable = [
      'date', 'shift', 'type_of_sample', 'testing_time', 'batch_no', 'packing_date', 'expiry_date',
      'flavour', 'taste', 'fat_percent', 'degree', 'acidity_percent', 'protein_percent',
      'adulteration', 'remark', 'sign_name', 'chemist_name', 'quality_incharge_name',
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
