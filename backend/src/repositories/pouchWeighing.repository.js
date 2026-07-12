const pool             = require('../config/database.config');
const activityRepository = require('./activity.repository');

// ─── Fixed time slots (9:00 AM – 8:00 PM, 30-min intervals = 23 slots) ────────
const FIXED_TIMESLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00',
];

// ─── Mappers ─────────────────────────────────────────────────────────────────

const mapReading = (row) => {
  if (!row) return null;
  return {
    ...row,
    weight_reading_ml: row.weight_reading_ml != null ? parseFloat(row.weight_reading_ml) : null,
  };
};

const mapHead = (row) => {
  if (!row) return null;
  return {
    ...row,
    pack_size_ml:           row.pack_size_ml           != null ? parseFloat(row.pack_size_ml)           : null,
    target_weight_min_ml:   row.target_weight_min_ml   != null ? parseFloat(row.target_weight_min_ml)   : null,
    target_weight_max_ml:   row.target_weight_max_ml   != null ? parseFloat(row.target_weight_max_ml)   : null,
  };
};

// ─── Helpers to build the nested structure from flat rows ────────────────────

/**
 * Given a flat list of sessions (each with unique id), fetch their nested
 * heads + readings and return an array of fully nested session objects.
 */
async function nestSessions(conn, sessionRows) {
  if (!sessionRows || sessionRows.length === 0) return [];

  const sessionIds = sessionRows.map((s) => s.id);
  const placeholders = sessionIds.map(() => '?').join(', ');

  const [headRows] = await conn.query(
    `SELECT * FROM pouch_weighing_heads WHERE session_id IN (${placeholders}) ORDER BY session_id, head_name`,
    sessionIds
  );

  const headIds = headRows.map((h) => h.id);
  let readingRows = [];
  if (headIds.length > 0) {
    const hPlaceholders = headIds.map(() => '?').join(', ');
    const [rRows] = await conn.query(
      `SELECT * FROM pouch_weighing_readings WHERE head_id IN (${hPlaceholders}) ORDER BY head_id, timing`,
      headIds
    );
    readingRows = rRows;
  }

  // Index readings by head_id
  const readingsByHead = {};
  for (const r of readingRows) {
    if (!readingsByHead[r.head_id]) readingsByHead[r.head_id] = [];
    readingsByHead[r.head_id].push(mapReading(r));
  }

  // Index heads by session_id
  const headsBySession = {};
  for (const h of headRows) {
    if (!headsBySession[h.session_id]) headsBySession[h.session_id] = [];
    headsBySession[h.session_id].push({
      ...mapHead(h),
      readings: readingsByHead[h.id] || [],
    });
  }

  // Assemble final sessions
  return sessionRows.map((s) => ({
    ...s,
    heads: headsBySession[s.id] || [],
  }));
}

// ─── Repository ───────────────────────────────────────────────────────────────

class PouchWeighingRepository {

  // ── Read helpers ─────────────────────────────────────────────────────────

  async findByDate(date) {
    const conn = await pool.getConnection();
    try {
      let sql = `
        SELECT s.*,
                u.full_name AS created_by_name
         FROM pouch_weighing_sessions s
         LEFT JOIN users u ON s.created_by = u.id
      `;
      const params = [];
      if (date) {
        sql += ` WHERE s.date = ?`;
        params.push(date);
      }
      sql += ` ORDER BY s.date DESC, s.id DESC`;

      const [rows] = await conn.query(sql, params);
      return nestSessions(conn, rows);
    } finally {
      conn.release();
    }
  }

  async findById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT s.*,
                u.full_name AS created_by_name
         FROM pouch_weighing_sessions s
         LEFT JOIN users u ON s.created_by = u.id
         WHERE s.id = ?`,
        [id]
      );
      if (!rows.length) return null;
      const nested = await nestSessions(conn, rows);
      return nested[0];
    } finally {
      conn.release();
    }
  }

  // ── Create (transactional) ────────────────────────────────────────────────

  /**
   * @param {Object} sessionData  - { date, packing_supervisor_name, quality_incharge_name, created_by, heads[] }
   * Each head: { head_name, batch_release_tank_number, operator_name, batch_no,
   *              mfg_date, exp_date, pack_size_ml, target_weight_min_ml,
   *              target_weight_max_ml, readings[] }
   * Each reading: { timing, weight_reading_ml }
   * @returns {number} sessionId
   */
  async createSession(sessionData) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insert session
      const [sessionResult] = await conn.query(
        `INSERT INTO pouch_weighing_sessions
         (date, packing_supervisor_name, quality_incharge_name, created_by)
         VALUES (?, ?, ?, ?)`,
        [
          sessionData.date,
          sessionData.packing_supervisor_name || null,
          sessionData.quality_incharge_name   || null,
          sessionData.created_by              || null,
        ]
      );
      const sessionId = sessionResult.insertId;

      // 2. Insert heads + readings
      const heads = sessionData.heads || [];
      for (const head of heads) {
        const [headResult] = await conn.query(
          `INSERT INTO pouch_weighing_heads
           (session_id, head_name, batch_release_tank_number, operator_name,
            batch_no, mfg_date, exp_date, pack_size_ml,
            target_weight_min_ml, target_weight_max_ml)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            head.head_name,
            head.batch_release_tank_number || null,
            head.operator_name             || null,
            head.batch_no                  || null,
            head.mfg_date                  || null,
            head.exp_date                  || null,
            head.pack_size_ml              ?? null,
            head.target_weight_min_ml      ?? null,
            head.target_weight_max_ml      ?? null,
          ]
        );
        const headId = headResult.insertId;

        // 3. Insert readings (all 23 fixed slots — value may be null)
        const readings = head.readings || [];
        for (const timing of FIXED_TIMESLOTS) {
          const found = readings.find((r) => r.timing === timing);
          await conn.query(
            `INSERT INTO pouch_weighing_readings (head_id, timing, weight_reading_ml)
             VALUES (?, ?, ?)`,
            [headId, timing, found?.weight_reading_ml ?? null]
          );
        }
      }

      await conn.commit();
      return sessionId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Update (transactional — delete old heads/readings, re-insert) ─────────

  /**
   * @param {number} id       - session id
   * @param {Object} data     - same shape as createSession (without created_by)
   * @returns {number}        affected rows (1)
   */
  async updateSession(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Update session header fields
      const updatable = ['date', 'packing_supervisor_name', 'quality_incharge_name'];
      const fields = [];
      const values = [];
      for (const field of updatable) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field] === '' ? null : data[field]);
        }
      }
      if (fields.length > 0) {
        values.push(id);
        await conn.query(
          `UPDATE pouch_weighing_sessions SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }

      // 2. Delete existing heads (CASCADE deletes readings too)
      await conn.query('DELETE FROM pouch_weighing_heads WHERE session_id = ?', [id]);

      // 3. Re-insert heads + readings (same logic as create)
      const heads = data.heads || [];
      for (const head of heads) {
        const [headResult] = await conn.query(
          `INSERT INTO pouch_weighing_heads
           (session_id, head_name, batch_release_tank_number, operator_name,
            batch_no, mfg_date, exp_date, pack_size_ml,
            target_weight_min_ml, target_weight_max_ml)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            head.head_name,
            head.batch_release_tank_number || null,
            head.operator_name             || null,
            head.batch_no                  || null,
            head.mfg_date                  || null,
            head.exp_date                  || null,
            head.pack_size_ml              ?? null,
            head.target_weight_min_ml      ?? null,
            head.target_weight_max_ml      ?? null,
          ]
        );
        const headId = headResult.insertId;

        const readings = head.readings || [];
        for (const timing of FIXED_TIMESLOTS) {
          const found = readings.find((r) => r.timing === timing);
          await conn.query(
            `INSERT INTO pouch_weighing_readings (head_id, timing, weight_reading_ml)
             VALUES (?, ?, ?)`,
            [headId, timing, found?.weight_reading_ml ?? null]
          );
        }
      }

      await conn.commit();
      return 1;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
  async deleteSession(id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query('DELETE FROM pouch_weighing_sessions WHERE id = ?', [id]);
      return result.affectedRows;
    } finally {
      conn.release();
    }
  }
}

module.exports = new PouchWeighingRepository();
