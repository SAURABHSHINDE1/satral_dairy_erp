const biProductService = require('../services/biProduct.service');

class BiProductController {
  async getAllReports(req, res, next) {
    try {
      const filters = {
        date:         req.query.date,
        date_from:    req.query.date_from,
        date_to:      req.query.date_to,
        product_name: req.query.product_name,
        batch_no:     req.query.batch_no,
        status:       req.query.status,
        limit:        req.query.limit  || 100,
        offset:       req.query.offset || 0,
      };
      const reports = await biProductService.getAllReports(filters);
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req, res, next) {
    try {
      const report = await biProductService.getReportById(req.params.id);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async createReport(req, res, next) {
    try {
      const report = await biProductService.createReport(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Bi-product report created successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req, res, next) {
    try {
      const report = await biProductService.updateReport(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({
        success: true,
        message: 'Bi-product report updated successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req, res, next) {
    try {
      const result = await biProductService.deleteReport(req.params.id, req.user.id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async approveReport(req, res, next) {
    try {
      const { action, comment } = req.body;
      const report = await biProductService.approveReport(
        req.params.id,
        { action, comment },
        req.user.id
      );
      res.json({
        success: true,
        message: `Report ${action} successfully`,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BiProductController();
