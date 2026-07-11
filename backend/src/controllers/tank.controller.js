const tankService = require('../services/tank.service');

class TankController {
  async getAllTankRecords(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        process_operator_id: req.query.process_operator_id,
        tank_number: req.query.tank_number,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const records = await tankService.getAllTankRecords(filters);

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }

  async getTankRecordById(req, res, next) {
    try {
      const record = await tankService.getTankRecordById(req.params.id);

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async createTankRecord(req, res, next) {
    try {
      const record = await tankService.createTankRecord(req.body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Tank record created successfully',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTankRecord(req, res, next) {
    try {
      const record = await tankService.updateTankRecord(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );

      res.json({
        success: true,
        message: 'Tank record updated successfully',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTankRecord(req, res, next) {
    try {
      const result = await tankService.deleteTankRecord(
        req.params.id,
        req.user.id,
        req.user.role
      );

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async approveByLab(req, res, next) {
    try {
      const { remarks } = req.body;
      const record = await tankService.approveByLab(req.params.id, req.user.id, remarks);

      res.json({
        success: true,
        message: 'Record approved by lab incharge',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectByLab(req, res, next) {
    try {
      const { remarks } = req.body;
      const record = await tankService.rejectByLab(req.params.id, req.user.id, remarks);

      res.json({
        success: true,
        message: 'Record rejected by lab incharge',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async approveByAdmin(req, res, next) {
    try {
      const { remarks } = req.body;
      const record = await tankService.approveByAdmin(req.params.id, req.user.id, remarks);

      res.json({
        success: true,
        message: 'Record approved by admin',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectByAdmin(req, res, next) {
    try {
      const { remarks } = req.body;
      const record = await tankService.rejectByAdmin(req.params.id, req.user.id, remarks);

      res.json({
        success: true,
        message: 'Record rejected by admin',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      const stats = await tankService.getStatistics(date_from, date_to);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getDailyTrend(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      const trend = await tankService.getDailyTrend(date_from, date_to);

      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TankController();
