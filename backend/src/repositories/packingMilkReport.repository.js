const pool         = require('../config/database.config');
const { paginate } = require('../utils/pagination.helper');

// ─── Explicit column list (avoids SELECT *) ───────────────────────────────────
const SELECT_COLS = `
  r.id, r.date, r.testing_time, r.tank_no, r.batch_no, r.packing_head,
  r.product_name, r.temp_celsius, r.acidity_percent, r.alcohol_result,
  r.fat_percent, r.clr, r.snf_percent, r.phosphatase_test,
  r.br, r.ph, r.ts, r.protein_percent, r.remark,
  r.chemist_name, r.quality_incharge_name,
  r.created_by, r.created_at,
  u.full_name AS created_by_name
`.trim();

const FROM_JOINS = `
  FROM packing_milk_reports r
  LEFT JOIN users u ON r.created_by = u.id
`.trim();

const mapRecord = (row) => {
  if (!row) return null;
  return {
    ...row,
    temp_celsius:      row.temp_celsius      != null ? parseFloat(row.temp_celsius)      : null,
    acidity_percent:   row.acidity_percent   != null ? parseFloat(row.acidity_percent)   : null,
    fat_percent:       row.fat_percent       != null ? parseFloat(row.fat_percent)       : null,
    clr:               row.clr               != null ? parseFloat(row.clr)               : null,
    snf_percent:       row.snf_percent       != null ? parseFloat(row.snf_percent)       : null,
    br:                row.br                != null ? parseFloat(row.br)                : null,
    ph:                row.ph                != null ? parseFloat(row.ph)                : null,
    ts:                row.ts                != null ? parseFloat(row.ts)                : null,
    protein_percent:   row.protein_percent   != null ? parseFloat(row.protein_percent)   : null,
  };
};

class PackingMilkReportRepository {
  // ─── findAll ──────────────────────────────────────────────────────────────
  /**
   * @param {Object} filters - { date?, date_from?, date_to?, product_name?, tank_no?, page?, limit? }
   * @returns {{ data, total, page, totalPages }}
   */
  async findAll(filters = {}) {
    const where  = [];
    const params = [];

    if (filters.date)         { where.push('r.date = ?');              params.push(filters.date); }
    if (filters.date_from)    { where.push('r.date >= ?');             params.push(filters.date_from); }
    if (filters.date_to)      { where.push('r.date <= ?');             params.push(filters.date_to); }
    if (filters.product_name) { where.push('r.product_name LIKE ?');  params.push(`%${filters.product_name}%`); }
    if (filters.tank_no)      { where.push('r.tank_no LIKE ?');       params.push(`%${filters.tank_no}%`); }

    const result = await paginate({
      pool,
      select : SELECT_COLS,
      from   : FROM_JOINS,
      where, params,
      orderBy: 'ORDER BY r.date DESC, r.testing_time ASC, r.created_at DESC',
      page   : filters.page,
      limit  : filters.limit,
    });

    return { ...result, data: result.data.map(mapRecord) };
  }

  // ─── findById ─────────────────────────────────────────────────────────────
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              u.full_name AS created_by_name
       FROM packing_milk_reports r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [id]
    );
    return mapRecord(rows[0]);
  }

  // ─── create ───────────────────────────────────────────────────────────────
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO packing_milk_reports
       (date, testing_time, tank_no, batch_no, packing_head, product_name,
        temp_celsius, acidity_percent, alcohol_result, fat_percent, clr,
        snf_percent, phosphatase_test, br, ph, ts, protein_percent,
        remark, chemist_name, quality_incharge_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.testing_time             || null,
        data.tank_no,
        data.batch_no,
        data.packing_head,
        data.product_name,
        data.temp_celsius             ?? null,
        data.acidity_percent          ?? null,
        data.alcohol_result           || null,
        data.fat_percent              ?? null,
        data.clr                      ?? null,
        data.snf_percent              ?? null,
        data.phosphatase_test         || null,
        data.br                       ?? null,
        data.ph                       ?? null,
        data.ts                       ?? null,
        data.protein_percent          ?? null,
        data.remark                   || null,
        data.chemist_name             || null,
        data.quality_incharge_name    || null,
        data.created_by               || null,
      ]
    );
    return result.insertId;
  }

  // ─── update ───────────────────────────────────────────────────────────────
  async update(id, data) {
    const updatable = [
      'date', 'testing_time', 'tank_no', 'batch_no', 'packing_head', 'product_name',
      'temp_celsius', 'acidity_percent', 'alcohol_result', 'fat_percent', 'clr',
      'snf_percent', 'phosphatase_test', 'br', 'ph', 'ts', 'protein_percent',
      'remark', 'chemist_name', 'quality_incharge_name',
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
      `UPDATE packing_milk_reports SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  // ─── delete ───────────────────────────────────────────────────────────────
  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM packing_milk_reports WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = new PackingMilkReportRepository();
