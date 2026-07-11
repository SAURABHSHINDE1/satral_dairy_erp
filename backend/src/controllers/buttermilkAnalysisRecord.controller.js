const buttermilkAnalysisRecordService = require('../services/buttermilkAnalysisRecord.service');

class ButtermilkAnalysisRecordController {
  async getAllRecords(req, res, next) {
    try {
      const filters = {
        date  : req.query.date,
        shift : req.query.shift,
        page  : parseInt(req.query.page)  || 1,
        limit : parseInt(req.query.limit) || 25,
      };
      const result = await buttermilkAnalysisRecordService.getAllRecords(filters);
      res.json({
        success   : true,
        data      : result.data,
        total     : result.total,
        page      : result.page,
        totalPages: result.totalPages,
      });
    } catch (error) { next(error); }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await buttermilkAnalysisRecordService.getRecordById(req.params.id);
      res.json({ success: true, data: record });
    } catch (error) { next(error); }
  }

  async createRecord(req, res, next) {
    try {
      const record = await buttermilkAnalysisRecordService.createRecord(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Buttermilk analysis record created successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }

  async updateRecord(req, res, next) {
    try {
      const record = await buttermilkAnalysisRecordService.updateRecord(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({
        success: true,
        message: 'Buttermilk analysis record updated successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }
}

module.exports = new ButtermilkAnalysisRecordController();
