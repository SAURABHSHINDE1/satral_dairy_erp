const pool            = require('../config/database.config');
const { paginate }    = require('../utils/pagination.helper');

// ─── Explicit column list (avoids SELECT *) ───────────────────────────────────
const SELECT_COLS = `
  r.id, r.date, r.testing_time, r.sample_name, r.type_of_milk,
  r.milk_quantity_lit, r.temp_celsius, r.ot, r.acidity_percent,
  r.alcohol_result, r.fat_percent, r.clr, r.snf, r.protein_percent,
  r.sodium_electrolyte_condition, r.ph,
  r.chemist_name, r.quality_incharge_name,
  r.status, r.approved_by, r.approved_at, r.approval_comment,
  r.created_by, r.created_at,
  u.full_name  AS created_by_name,
  ab.full_name AS approved_by_name
`.trim();

const FROM_JOINS = `
  FROM raw_bulk_milk_testing_records r
  LEFT JOIN users u  ON r.created_by  = u.id
  LEFT JOIN users ab ON r.approved_by = ab.id
`.trim();

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
  /**
   * List records with pagination.
   * @param {Object} filters - { date?, date_from?, date_to?, sample_name?, status?, page?, limit? }
   * @returns {{ data, total, page, totalPages }}
   */
  async findAll(filters = {}) {
    const where  = [];
    const params = [];

    if (filters.date)        { where.push('r.date = ?');               params.push(filters.date); }
    if (filters.date_from)   { where.push('r.date >= ?');              params.push(filters.date_from); }
    if (filters.date_to)     { where.push('r.date <= ?');              params.push(filters.date_to); }
    if (filters.sample_name) { where.push('r.sample_name LIKE ?');     params.push(`%${filters.sample_name}%`); }
    if (filters.status)      { where.push('r.status = ?');             params.push(filters.status); }

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
