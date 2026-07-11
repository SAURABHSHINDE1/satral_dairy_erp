const pool         = require('../config/database.config');
const { paginate } = require('../utils/pagination.helper');

// ─── Explicit column list (avoids SELECT *) ───────────────────────────────────
const SELECT_COLS = `
  r.id, r.date, r.shift, r.testing_time, r.tank_no, r.type_of_milk,
  r.milk_quantity_l, r.temp_celsius, r.flavour_taste,
  r.acidity_percent, r.alcohol_result, r.fat_percent, r.clr,
  r.snf_percent, r.efficiency_percent, r.protein_percent,
  r.electrolyte_condition, r.remark,
  r.status, r.approved_by, r.approved_at, r.approval_comment,
  r.chemist_name, r.quality_incharge_name,
  r.created_by, r.created_at,
  u.full_name  AS created_by_name,
  ab.full_name AS approved_by_name
`.trim();

const FROM_JOINS = `
  FROM final_product_storage_records r
  LEFT JOIN users u  ON r.created_by  = u.id
  LEFT JOIN users ab ON r.approved_by = ab.id
`.trim();

const mapRecord = (row) => {
  if (!row) return null;
  return {
    ...row,
    milk_quantity_l:      row.milk_quantity_l      != null ? parseFloat(row.milk_quantity_l)      : null,
    temp_celsius:         row.temp_celsius          != null ? parseFloat(row.temp_celsius)          : null,
    acidity_percent:      row.acidity_percent       != null ? parseFloat(row.acidity_percent)       : null,
    fat_percent:          row.fat_percent           != null ? parseFloat(row.fat_percent)           : null,
    clr:                  row.clr                   != null ? parseFloat(row.clr)                   : null,
    snf_percent:          row.snf_percent           != null ? parseFloat(row.snf_percent)           : null,
    efficiency_percent:   row.efficiency_percent    != null ? parseFloat(row.efficiency_percent)    : null,
    protein_percent:      row.protein_percent       != null ? parseFloat(row.protein_percent)       : null,
  };
};

class FinalProductRepository {
  /**
   * List records with pagination.
   * @param {Object} filters - { date?, shift?, date_from?, date_to?, status?, page?, limit? }
   * @returns {{ data, total, page, totalPages }}
   */
  async findAll(filters = {}) {
    const where  = [];
    const params = [];

    if (filters.date)      { where.push('r.date = ?');     params.push(filters.date); }
    if (filters.shift)     { where.push('r.shift = ?');    params.push(filters.shift); }
    if (filters.date_from) { where.push('r.date >= ?');    params.push(filters.date_from); }
    if (filters.date_to)   { where.push('r.date <= ?');    params.push(filters.date_to); }
    if (filters.status)    { where.push('r.status = ?');   params.push(filters.status); }

    const result = await paginate({
      pool,
      select : SELECT_COLS,
      from   : FROM_JOINS,
      where, params,
      orderBy: 'ORDER BY r.date DESC, r.shift ASC, r.created_at DESC',
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
       FROM final_product_storage_records r
       LEFT JOIN users u  ON r.created_by  = u.id
       LEFT JOIN users ab ON r.approved_by = ab.id
       WHERE r.id = ?`,
      [id]
    );
    return mapRecord(rows[0]);
  }

  async approve(id, { status, approved_by, approval_comment }) {
    const [result] = await pool.query(
      `UPDATE final_product_storage_records
       SET status = ?, approved_by = ?, approved_at = NOW(), approval_comment = ?
       WHERE id = ?`,
      [status, approved_by, approval_comment || null, id]
    );
    return result.affectedRows;
  }

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO final_product_storage_records
       (date, shift, testing_time, tank_no, type_of_milk, milk_quantity_l,
        temp_celsius, flavour_taste, acidity_percent, alcohol_result,
        fat_percent, clr, snf_percent, efficiency_percent, protein_percent,
        electrolyte_condition, remark, chemist_name, quality_incharge_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.shift,
        data.testing_time       || null,
        data.tank_no,
        data.type_of_milk       || 'cow',
        data.milk_quantity_l    ?? null,
        data.temp_celsius       ?? null,
        data.flavour_taste      || null,
        data.acidity_percent    ?? null,
        data.alcohol_result     || null,
        data.fat_percent        ?? null,
        data.clr                ?? null,
        data.snf_percent        ?? null,
        data.efficiency_percent ?? null,
        data.protein_percent    ?? null,
        data.electrolyte_condition || null,
        data.remark             || null,
        data.chemist_name       || null,
        data.quality_incharge_name || null,
        data.created_by         || null,
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const updatable = [
      'date', 'shift', 'testing_time', 'tank_no', 'type_of_milk',
      'milk_quantity_l', 'temp_celsius', 'flavour_taste', 'acidity_percent',
      'alcohol_result', 'fat_percent', 'clr', 'snf_percent',
      'efficiency_percent', 'protein_percent', 'electrolyte_condition',
      'remark', 'chemist_name', 'quality_incharge_name',
    ];

    for (const field of updatable) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE final_product_storage_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM final_product_storage_records WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = new FinalProductRepository();
