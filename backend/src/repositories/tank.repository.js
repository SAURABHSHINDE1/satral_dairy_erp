const pool = require('../config/database.config');

const mapRecord = (row) => {
  if (!row) return null;
  return {
    ...row,
    milk_quantity: row.milk_quantity !== null && row.milk_quantity !== undefined ? parseFloat(row.milk_quantity) : null,
    fat_percentage: row.fat_percentage !== null && row.fat_percentage !== undefined ? parseFloat(row.fat_percentage) : null,
    snf_percentage: row.snf_percentage !== null && row.snf_percentage !== undefined ? parseFloat(row.snf_percentage) : null,
    temperature: row.temperature !== null && row.temperature !== undefined ? parseFloat(row.temperature) : null,
  };
};

const mapStats = (row) => {
  if (!row) return null;
  return {
    ...row,
    total_records: row.total_records !== null && row.total_records !== undefined ? parseInt(row.total_records) : 0,
    approved_records: row.approved_records !== null && row.approved_records !== undefined ? parseInt(row.approved_records) : 0,
    pending_records: row.pending_records !== null && row.pending_records !== undefined ? parseInt(row.pending_records) : 0,
    rejected_records: row.rejected_records !== null && row.rejected_records !== undefined ? parseInt(row.rejected_records) : 0,
    total_milk_quantity: row.total_milk_quantity !== null && row.total_milk_quantity !== undefined ? parseFloat(row.total_milk_quantity) : 0,
    avg_fat: row.avg_fat !== null && row.avg_fat !== undefined ? parseFloat(row.avg_fat) : 0,
    avg_snf: row.avg_snf !== null && row.avg_snf !== undefined ? parseFloat(row.avg_snf) : 0,
    avg_temperature: row.avg_temperature !== null && row.avg_temperature !== undefined ? parseFloat(row.avg_temperature) : 0,
  };
};

const mapTrend = (row) => {
  if (!row) return null;
  return {
    ...row,
    records: row.records !== null && row.records !== undefined ? parseInt(row.records) : 0,
    total_quantity: row.total_quantity !== null && row.total_quantity !== undefined ? parseFloat(row.total_quantity) : 0,
    avg_fat: row.avg_fat !== null && row.avg_fat !== undefined ? parseFloat(row.avg_fat) : 0,
  };
};

class TankRepository {
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT tr.*, 
        u1.full_name as operator_name,
        u2.full_name as lab_incharge_name
       FROM tank_records tr
       LEFT JOIN users u1 ON tr.process_operator_id = u1.id
       LEFT JOIN users u2 ON tr.lab_incharge_id = u2.id
       WHERE tr.id = ?`,
      [id]
    );
    return mapRecord(rows[0]);
  }

  async findAll(filters = {}) {
    let query = `
      SELECT tr.*, 
        u1.full_name as operator_name,
        u2.full_name as lab_incharge_name
      FROM tank_records tr
      LEFT JOIN users u1 ON tr.process_operator_id = u1.id
      LEFT JOIN users u2 ON tr.lab_incharge_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND tr.status = ?';
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += ' AND tr.date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND tr.date <= ?';
      params.push(filters.date_to);
    }

    if (filters.process_operator_id) {
      query += ' AND tr.process_operator_id = ?';
      params.push(filters.process_operator_id);
    }

    if (filters.tank_number) {
      query += ' AND tr.tank_number LIKE ?';
      params.push(`%${filters.tank_number}%`);
    }

    query += ' ORDER BY tr.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const [rows] = await pool.query(query, params);
    return rows.map(mapRecord);
  }

  async create(tankData) {
    const [result] = await pool.query(
      `INSERT INTO tank_records 
       (date, tank_number, batch_number, milk_quantity, fat_percentage, snf_percentage, 
        temperature, milk_type, process_operator_id, lab_incharge_id, tank_release_time,
        packing_machine_detail, release_time, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tankData.date,
        tankData.tank_number,
        tankData.batch_number,
        tankData.milk_quantity,
        tankData.fat_percentage,
        tankData.snf_percentage,
        tankData.temperature,
        tankData.milk_type,
        tankData.process_operator_id,
        tankData.lab_incharge_id || null,
        tankData.tank_release_time || null,
        tankData.packing_machine_detail || null,
        tankData.release_time || null,
        tankData.remarks || null,
        tankData.status || 'draft'
      ]
    );
    return result.insertId;
  }

  async update(id, tankData) {
    const fields = [];
    const values = [];

    if (tankData.date !== undefined) {
      fields.push('date = ?');
      values.push(tankData.date);
    }

    if (tankData.tank_number !== undefined) {
      fields.push('tank_number = ?');
      values.push(tankData.tank_number);
    }

    if (tankData.batch_number !== undefined) {
      fields.push('batch_number = ?');
      values.push(tankData.batch_number);
    }

    if (tankData.milk_quantity !== undefined) {
      fields.push('milk_quantity = ?');
      values.push(tankData.milk_quantity);
    }

    if (tankData.fat_percentage !== undefined) {
      fields.push('fat_percentage = ?');
      values.push(tankData.fat_percentage);
    }

    if (tankData.snf_percentage !== undefined) {
      fields.push('snf_percentage = ?');
      values.push(tankData.snf_percentage);
    }

    if (tankData.temperature !== undefined) {
      fields.push('temperature = ?');
      values.push(tankData.temperature);
    }

    if (tankData.milk_type !== undefined) {
      fields.push('milk_type = ?');
      values.push(tankData.milk_type);
    }

    if (tankData.lab_incharge_id !== undefined) {
      fields.push('lab_incharge_id = ?');
      values.push(tankData.lab_incharge_id);
    }

    if (tankData.tank_release_time !== undefined) {
      fields.push('tank_release_time = ?');
      values.push(tankData.tank_release_time);
    }

    if (tankData.packing_machine_detail !== undefined) {
      fields.push('packing_machine_detail = ?');
      values.push(tankData.packing_machine_detail);
    }

    if (tankData.release_time !== undefined) {
      fields.push('release_time = ?');
      values.push(tankData.release_time);
    }

    if (tankData.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(tankData.remarks);
    }

    if (tankData.status !== undefined) {
      fields.push('status = ?');
      values.push(tankData.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE tank_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM tank_records WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM tank_records WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += ' AND date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND date <= ?';
      params.push(filters.date_to);
    }

    if (filters.process_operator_id) {
      query += ' AND process_operator_id = ?';
      params.push(filters.process_operator_id);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count;
  }
  async getStatistics(dateFrom, dateTo) {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_records,
        SUM(CASE WHEN status IN ('pending_lab', 'pending_admin') THEN 1 ELSE 0 END) as pending_records,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_records,
        SUM(milk_quantity) as total_milk_quantity,
        AVG(fat_percentage) as avg_fat,
        AVG(snf_percentage) as avg_snf,
        AVG(temperature) as avg_temperature
       FROM tank_records
       WHERE date BETWEEN ? AND ?`,
      [dateFrom, dateTo]
    );
    return mapStats(rows[0]);
  }

  async getDailyTrend(dateFrom, dateTo) {
    const [rows] = await pool.query(
      `SELECT 
        date,
        COUNT(*) as records,
        SUM(milk_quantity) as total_quantity,
        AVG(fat_percentage) as avg_fat
       FROM tank_records
       WHERE date BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
      [dateFrom, dateTo]
    );
    return rows.map(mapTrend);
  }
}

module.exports = new TankRepository();
