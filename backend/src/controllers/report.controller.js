const reportService = require('../services/report.service');

class ReportController {
  async getDailyReport(req, res, next) {
    try {
      const { date, module: moduleName } = req.query;
      const report = await reportService.getDailyReport(date, moduleName);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getWeeklyReport(req, res, next) {
    try {
      const { start_date, end_date, module: moduleName } = req.query;
      const report = await reportService.getWeeklyReport(start_date, end_date, moduleName);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyReport(req, res, next) {
    try {
      const { year, month, module: moduleName } = req.query;
      const report = await reportService.getMonthlyReport(year, month, moduleName);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomReport(req, res, next) {
    try {
      const { start_date, end_date, module: moduleName } = req.query;
      const filters = {
        status: req.query.status
      };
      const report = await reportService.getCustomReport(start_date, end_date, filters, moduleName);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getApprovalStatistics(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      const stats = await reportService.getApprovalStatistics(start_date, end_date);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserActivityReport(req, res, next) {
    try {
      const { user_id, start_date, end_date } = req.query;
      const report = await reportService.getUserActivityReport(user_id, start_date, end_date);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
