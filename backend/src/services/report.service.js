const tankRepository = require('../repositories/tank.repository');
const activityRepository = require('../repositories/activity.repository');

class ReportService {
  async getDailyReport(date) {
    const records = await tankRepository.findAll({
      date_from: date,
      date_to: date
    });

    const stats = await tankRepository.getStatistics(date, date);

    return {
      date,
      statistics: stats,
      records
    };
  }

  async getWeeklyReport(startDate, endDate) {
    const records = await tankRepository.findAll({
      date_from: startDate,
      date_to: endDate
    });

    const stats = await tankRepository.getStatistics(startDate, endDate);
    const dailyTrend = await tankRepository.getDailyTrend(startDate, endDate);

    return {
      startDate,
      endDate,
      statistics: stats,
      dailyTrend,
      records
    };
  }

  async getMonthlyReport(year, month) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const records = await tankRepository.findAll({
      date_from: startDate,
      date_to: endDate
    });

    const stats = await tankRepository.getStatistics(startDate, endDate);
    const dailyTrend = await tankRepository.getDailyTrend(startDate, endDate);

    return {
      year,
      month,
      startDate,
      endDate,
      statistics: stats,
      dailyTrend,
      records
    };
  }

  async getCustomReport(startDate, endDate, filters = {}) {
    const records = await tankRepository.findAll({
      date_from: startDate,
      date_to: endDate,
      ...filters
    });

    const stats = await tankRepository.getStatistics(startDate, endDate);
    const dailyTrend = await tankRepository.getDailyTrend(startDate, endDate);

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
