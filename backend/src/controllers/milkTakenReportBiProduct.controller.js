const milkTakenReportBiProductService = require('../services/milkTakenReportBiProduct.service');

class MilkTakenReportBiProductController {
  async getAllRecords(req, res, next) {
    try {
      const filters = {
        date:         req.query.date,
        date_from:    req.query.date_from,
        date_to:      req.query.date_to,
        product_name: req.query.product_name,
        page :        parseInt(req.query.page)  || 1,
        limit:        parseInt(req.query.limit) || 25,
      };
      const result = await milkTakenReportBiProductService.getAllRecords(filters);
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
      const record = await milkTakenReportBiProductService.getRecordById(req.params.id);
      res.json({ success: true, data: record });
    } catch (error) { next(error); }
  }

  async createRecord(req, res, next) {
    try {
      const record = await milkTakenReportBiProductService.createRecord(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Milk taken report (bi-product) record created successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }

  async updateRecord(req, res, next) {
    try {
      const record = await milkTakenReportBiProductService.updateRecord(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({
        success: true,
        message: 'Milk taken report (bi-product) record updated successfully',
        data: record,
      });
    } catch (error) { next(error); }
  }

  async deleteRecord(req, res, next) {
    try {
      const result = await milkTakenReportBiProductService.deleteRecord(req.params.id, req.user.id);
      res.json({ success: true, message: result.message });
    } catch (error) { next(error); }
  }
}

module.exports = new MilkTakenReportBiProductController();
