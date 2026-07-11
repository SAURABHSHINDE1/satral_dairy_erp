const pool         = require('../config/database.config');
const { paginate } = require('../utils/pagination.helper');

// ─── Explicit column list (avoids SELECT *) ───────────────────────────────────
const SELECT_COLS = `
  r.id, r.batch_no, r.date, r.product_name,
  r.body_structure, r.sensory, r.taste, r.temp_celsius,
  r.acidity_percent, r.ph, r.self_life, r.fdm,
  r.fat_percent, r.ts, r.lassi_viscosity, r.moisture,
  r.status, r.approved_by, r.approved_at, r.approval_comment,
  r.chemist_name, r.quality_incharge_name,
  r.created_by, r.created_at,
  u.full_name  AS created_by_name,
  ab.full_name AS approved_by_name
`.trim();

const FROM_JOINS = `
  FROM bi_product_reports r
  LEFT JOIN users u  ON r.created_by  = u.id
  LEFT JOIN users ab ON r.approved_by = ab.id
`.trim();

const mapRecord = (row) => {
  if (!row) return null;
  return {
    ...row,
    temp_celsius:      row.temp_celsius      != null ? parseFloat(row.temp_celsius)      : null,
    acidity_percent:   row.acidity_percent   != null ? parseFloat(row.acidity_percent)   : null,
    ph:                row.ph                != null ? parseFloat(row.ph)                : null,
    fdm:               row.fdm               != null ? parseFloat(row.fdm)               : null,
    fat_percent:       row.fat_percent       != null ? parseFloat(row.fat_percent)       : null,
    ts:                row.ts                != null ? parseFloat(row.ts)                : null,
    lassi_viscosity:   row.lassi_viscosity   != null ? parseFloat(row.lassi_viscosity)   : null,
    moisture:          row.moisture          != null ? parseFloat(row.moisture)          : null,
  };
};

class BiProductRepository {
  /**
   * List records with pagination.
   * @param {Object} filters - { date?, date_from?, date_to?, product_name?, batch_no?, status?, page?, limit? }
   * @returns {{ data, total, page, totalPages }}
   */
  async findAll(filters = {}) {
    const where  = [];
    const params = [];

    if (filters.date)         { where.push('r.date = ?');              params.push(filters.date); }
    if (filters.date_from)    { where.push('r.date >= ?');             params.push(filters.date_from); }
    if (filters.date_to)      { where.push('r.date <= ?');             params.push(filters.date_to); }
    if (filters.product_name) { where.push('r.product_name LIKE ?');  params.push(`%${filters.product_name}%`); }
    if (filters.batch_no)     { where.push('r.batch_no LIKE ?');      params.push(`%${filters.batch_no}%`); }
    if (filters.status)       { where.push('r.status = ?');           params.push(filters.status); }

    const result = await paginate({
      pool,
      select : SELECT_COLS,
      from   : FROM_JOINS,
      where, params,
      orderBy: 'ORDER BY r.date DESC, r.created_at DESC',
      page   : filters.page,
      limit  : filters.limit,
    });

    return { ...result, data: result.data.map(mapRecord) };
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              u.full_name  AS created_by_name,
              ab.full_name AS approved_by_name
       FROM bi_product_reports r
       LEFT JOIN users u  ON r.created_by  = u.id
       LEFT JOIN users ab ON r.approved_by = ab.id
       WHERE r.id = ?`,
      [id]
    );
    return mapRecord(rows[0]);
  }

  async approve(id, { status, approved_by, approval_comment }) {
    const [result] = await pool.query(
      `UPDATE bi_product_reports
       SET status = ?, approved_by = ?, approved_at = NOW(), approval_comment = ?
       WHERE id = ?`,
      [status, approved_by, approval_comment || null, id]
    );
    return result.affectedRows;
  }

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO bi_product_reports
       (batch_no, date, product_name, body_structure, sensory, taste,
        temp_celsius, acidity_percent, ph, self_life, fdm, fat_percent,
        ts, lassi_viscosity, moisture, chemist_name, quality_incharge_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.batch_no,
        data.date,
        data.product_name,
        data.body_structure      || null,
        data.sensory             || null,
        data.taste               || null,
        data.temp_celsius        ?? null,
        data.acidity_percent     ?? null,
        data.ph                  ?? null,
        data.self_life           || null,
        data.fdm                 ?? null,
        data.fat_percent         ?? null,
        data.ts                  ?? null,
        data.lassi_viscosity     ?? null,
        data.moisture            ?? null,
        data.chemist_name        || null,
        data.quality_incharge_name || null,
        data.created_by          || null,
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    const updatable = [
      'batch_no', 'date', 'product_name', 'body_structure', 'sensory',
      'taste', 'temp_celsius', 'acidity_percent', 'ph', 'self_life',
      'fdm', 'fat_percent', 'ts', 'lassi_viscosity', 'moisture',
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
      `UPDATE bi_product_reports SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM bi_product_reports WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = new BiProductRepository();
