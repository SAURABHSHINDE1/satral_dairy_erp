const finalProductService = require('../services/finalProduct.service');

class FinalProductController {
  async getAllRecords(req, res, next) {
    try {
      const filters = {
        date:      req.query.date,
        shift:     req.query.shift,
        status:    req.query.status,
        date_from: req.query.date_from,
        date_to:   req.query.date_to,
        limit:     req.query.limit  || 100,
        offset:    req.query.offset || 0,
      };

      const records = await finalProductService.getAllRecords(filters);

      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await finalProductService.getRecordById(req.params.id);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async createRecord(req, res, next) {
    try {
      const record = await finalProductService.createRecord(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Final product storage record created successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const record = await finalProductService.updateRecord(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({
        success: true,
        message: 'Final product storage record updated successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const result = await finalProductService.deleteRecord(req.params.id, req.user.id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async approveRecord(req, res, next) {
    try {
      const { action, comment } = req.body;
      const record = await finalProductService.approveRecord(
        req.params.id,
        { action, comment },
        req.user.id
      );
      res.json({
        success: true,
        message: `Record ${action} successfully`,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FinalProductController();
