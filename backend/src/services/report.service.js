const tankRepository = require('../repositories/tank.repository');
const activityRepository = require('../repositories/activity.repository');

class ReportService {
  async getGenericReport(moduleName, startDate, endDate) {
    const pool = require('../config/database.config');
    // Sanitization of table name to prevent SQL injection (only alphanumeric and underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(moduleName)) {
      throw new Error('Invalid module name');
    }

    const [records] = await pool.query(
      `SELECT * FROM \`${moduleName}\` WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
      [startDate, endDate]
    );

    const [trendRows] = await pool.query(
      `SELECT date, COUNT(*) as records FROM \`${moduleName}\` WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date ASC`,
      [startDate, endDate]
    );

    const stats = {
      total_records: records.length,
      approved_records: records.filter(r => r.status === 'approved').length,
      pending_records: records.filter(r => r.status === 'pending_lab' || r.status === 'pending_admin' || r.status === 'draft').length,
      rejected_records: records.filter(r => r.status === 'rejected').length
    };

    if (records.length > 0) {
      const sample = records[0];
      const numericKeys = Object.keys(sample).filter(key => {
        if (['id', 'created_by', 'user_id', 'session_id', 'created_at', 'updated_at'].includes(key)) return false;
        const val = sample[key];
        return val !== null && val !== undefined && (typeof val === 'number' || (typeof val === 'string' && !isNaN(val) && val.trim() !== ''));
      });

      numericKeys.forEach(key => {
        let sum = 0;
        let count = 0;
        records.forEach(r => {
          const val = parseFloat(r[key]);
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        });
        if (count > 0) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('qty') || lowerKey.includes('quantity') || lowerKey.includes('volume') || lowerKey.includes('weight')) {
            stats[`total_${key}`] = sum;
          } else {
            stats[`avg_${key}`] = sum / count;
          }
        }
      });
    }

    const dailyTrend = trendRows.map(r => ({
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      records: r.records
    }));

    return {
      startDate,
      endDate,
      statistics: stats,
      dailyTrend,
      records
    };
  }

  async getDailyReport(date, moduleName = 'tank_records') {
    return this.getGenericReport(moduleName, date, date);
  }

  async getWeeklyReport(startDate, endDate, moduleName = 'tank_records') {
    return this.getGenericReport(moduleName, startDate, endDate);
  }

  async getMonthlyReport(year, month, moduleName = 'tank_records') {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    return this.getGenericReport(moduleName, startDate, endDate);
  }

  async getCustomReport(startDate, endDate, filters = {}, moduleName = 'tank_records') {
    const pool = require('../config/database.config');
    let query = `SELECT * FROM \`${moduleName}\` WHERE date BETWEEN ? AND ?`;
    const params = [startDate, endDate];

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY date DESC`;

    const [records] = await pool.query(query, params);

    const [trendRows] = await pool.query(
      `SELECT date, COUNT(*) as records FROM \`${moduleName}\` WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date ASC`,
      [startDate, endDate]
    );

    const stats = {
      total_records: records.length,
      approved_records: records.filter(r => r.status === 'approved').length,
      pending_records: records.filter(r => r.status === 'pending_lab' || r.status === 'pending_admin' || r.status === 'draft').length,
      rejected_records: records.filter(r => r.status === 'rejected').length
    };

    if (records.length > 0) {
      const sample = records[0];
      const numericKeys = Object.keys(sample).filter(key => {
        if (['id', 'created_by', 'user_id', 'session_id', 'created_at', 'updated_at'].includes(key)) return false;
        const val = sample[key];
        return val !== null && val !== undefined && (typeof val === 'number' || (typeof val === 'string' && !isNaN(val) && val.trim() !== ''));
      });

      numericKeys.forEach(key => {
        let sum = 0;
        let count = 0;
        records.forEach(r => {
          const val = parseFloat(r[key]);
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        });
        if (count > 0) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('qty') || lowerKey.includes('quantity') || lowerKey.includes('volume') || lowerKey.includes('weight')) {
            stats[`total_${key}`] = sum;
          } else {
            stats[`avg_${key}`] = sum / count;
          }
        }
      });
    }

    const dailyTrend = trendRows.map(r => ({
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      records: r.records
    }));

    return {
      startDate,
      endDate,
      statistics: stats,
      dailyTrend,
      records
    };
  }

  async getApprovalStatistics(startDate, endDate) {
    const pool = require('../config/database.config');
    
    const [rows] = await pool.query(
      `SELECT 
        approver_role,
        action,
        COUNT(*) as count
       FROM approvals a
       JOIN tank_records tr ON a.tank_record_id = tr.id
       WHERE tr.date BETWEEN ? AND ?
       GROUP BY approver_role, action`,
      [startDate, endDate]
    );

    return rows;
  }

  async getUserActivityReport(userId, startDate, endDate) {
    const activities = await activityRepository.findAll({
      user_id: userId,
      date_from: startDate,
      date_to: endDate
    });

    const pool = require('../config/database.config');
    const [stats] = await pool.query(
      `SELECT 
        action,
        COUNT(*) as count
       FROM activity_logs
       WHERE user_id = ? 
       AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY action`,
      [userId, startDate, endDate]
    );

    return {
      userId,
      startDate,
      endDate,
      statistics: stats,
      activities
    };
  }
}

module.exports = new ReportService();
