const rawBulkMilkService = require('../services/rawBulkMilk.service');

class RawBulkMilkController {
  async getAllRecords(req, res, next) {
    try {
      const filters = {
        date:        req.query.date,
        date_from:   req.query.date_from,
        date_to:     req.query.date_to,
        sample_name: req.query.sample_name,
        status:      req.query.status,
        limit:       req.query.limit  || 200,
        offset:      req.query.offset || 0,
      };
      const records = await rawBulkMilkService.getAllRecords(filters);
      res.json({ success: true, data: records });
    } catch (error) { next(error); }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await rawBulkMilkService.getRecordById(req.params.id);
      res.json({ success: true, data: record });
    } catch (error) { next(error); }
  }

  async createRecord(req, res, next) {
    try {
      const record = await rawBulkMilkService.createRecord(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Raw bulk milk testing record created successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }

  async updateRecord(req, res, next) {
    try {
      const record = await rawBulkMilkService.updateRecord(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Raw bulk milk testing record updated successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }

  async deleteRecord(req, res, next) {
    try {
      const result = await rawBulkMilkService.deleteRecord(req.params.id, req.user.id);
      res.json({ success: true, message: result.message });
    } catch (error) { next(error); }
  }

  async approveRecord(req, res, next) {
    try {
      const { action, comment } = req.body;
      const record = await rawBulkMilkService.approveRecord(
        req.params.id,
        { action, comment },
        req.user.id
      );
      res.json({
        success: true,
        message: `Record ${action} successfully`,
        data: record,
      });
    } catch (error) { next(error); }
  }
}

module.exports = new RawBulkMilkController();
