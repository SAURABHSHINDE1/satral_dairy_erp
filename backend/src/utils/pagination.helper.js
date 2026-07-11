/**
 * ═══════════════════════════════════════════════════════════════
 * pagination.helper.js
 * ═══════════════════════════════════════════════════════════════
 * Generic offset-based pagination utility for all quality
 * testing modules.
 *
 * HOW TO USE (copy this pattern into every new module):
 *
 *   const { paginate } = require('../utils/pagination.helper');
 *
 *   const result = await paginate({
 *     pool,
 *     select : 'r.id, r.date, r.shift, r.type_of_sample, u.full_name AS created_by_name',
 *     from   : 'FROM my_table r LEFT JOIN users u ON r.created_by = u.id',
 *     where  : whereClauses,   // string[]  e.g. ['r.date = ?', 'r.status = ?']
 *     params : whereParams,    // any[]     matching values for each clause
 *     orderBy: 'ORDER BY r.date DESC, r.created_at DESC',
 *     page   : parseInt(req.query.page)  || 1,
 *     limit  : parseInt(req.query.limit) || 25,
 *   });
 *
 *   // result → { data: [...rows], total, page, totalPages }
 *
 * RESPONSE FORMAT (standardised across all modules):
 *   res.json({
 *     success: true,
 *     data      : result.data,
 *     total     : result.total,
 *     page      : result.page,
 *     totalPages: result.totalPages,
 *   });
 *
 * LIMITS:
 *   - Default : 25 rows per page
 *   - Maximum : 100 rows per page  (hard-capped to protect DB)
 *   - page    : 1-based index
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * @param {Object}   opts
 * @param {Object}   opts.pool      - mysql2 promise pool
 * @param {string}   opts.select    - comma-separated column list (NO "SELECT" keyword)
 * @param {string}   opts.from      - FROM clause including JOINs  (NO trailing WHERE)
 * @param {string[]} opts.where     - array of SQL condition strings e.g. ['r.date = ?']
 * @param {any[]}    opts.params    - bound parameter values matching each where clause
 * @param {string}   opts.orderBy   - ORDER BY clause string
 * @param {number}   opts.page      - 1-based page number
 * @param {number}   opts.limit     - rows per page
 * @returns {Promise<{data: any[], total: number, page: number, totalPages: number}>}
 */
async function paginate({ pool, select, from, where = [], params = [], orderBy, page, limit }) {
  // ── Sanitise page / limit ──────────────────────────────────────────────────
  const parsedPage  = Math.max(1, parseInt(page)  || 1);
  const rawLimit    = parseInt(limit) || 25;
  const parsedLimit = Math.min(100, Math.max(1, rawLimit));
  const offset      = (parsedPage - 1) * parsedLimit;

  // ── Build WHERE fragment ───────────────────────────────────────────────────
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  // ── COUNT query (no ORDER BY, no LIMIT for performance) ───────────────────
  const countQuery = `SELECT COUNT(*) AS total ${from} ${whereSql}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = parseInt(countRows[0]?.total ?? 0);

  // ── DATA query ─────────────────────────────────────────────────────────────
  const dataQuery = `SELECT ${select} ${from} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`;
  const [dataRows] = await pool.query(dataQuery, [...params, parsedLimit, offset]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / parsedLimit);

  return {
    data      : dataRows,
    total,
    page      : parsedPage,
    totalPages,
  };
}

module.exports = { paginate };
