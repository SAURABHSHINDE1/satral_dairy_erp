const packingMilkReportService = require('../services/packingMilkReport.service');

class PackingMilkReportController {
  async getAllRecords(req, res, next) {
    try {
      const filters = {
        date:         req.query.date,
        date_from:    req.query.date_from,
        date_to:      req.query.date_to,
        product_name: req.query.product_name,
        tank_no:      req.query.tank_no,
        limit:        req.query.limit  || 200,
        offset:       req.query.offset || 0,
      };
      const records = await packingMilkReportService.getAllRecords(filters);
      res.json({ success: true, data: records });
    } catch (error) { next(error); }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await packingMilkReportService.getRecordById(req.params.id);
      res.json({ success: true, data: record });
    } catch (error) { next(error); }
  }

  async createRecord(req, res, next) {
    try {
      const record = await packingMilkReportService.createRecord(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Packing milk report record created successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }

  async updateRecord(req, res, next) {
    try {
      const record = await packingMilkReportService.updateRecord(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({
        success: true,
        message: 'Packing milk report record updated successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }

  async deleteRecord(req, res, next) {
    try {
      const result = await packingMilkReportService.deleteRecord(req.params.id, req.user.id);
      res.json({ success: true, message: result.message });
    } catch (error) { next(error); }
  }
}

module.exports = new PackingMilkReportController();
