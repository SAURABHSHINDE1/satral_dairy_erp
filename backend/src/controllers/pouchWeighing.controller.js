const pouchWeighingService = require('../services/pouchWeighing.service');

class PouchWeighingController {

  async getSessions(req, res, next) {
    try {
      const { date } = req.query;
      const sessions = await pouchWeighingService.getByDate(date);
      res.json({ success: true, data: sessions });
    } catch (error) { next(error); }
  }

  async getSessionById(req, res, next) {
    try {
      const session = await pouchWeighingService.getById(req.params.id);
      res.json({ success: true, data: session });
    } catch (error) { next(error); }
  }

  async createSession(req, res, next) {
    try {
      const session = await pouchWeighingService.createSession(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Pouch weighing session created successfully',
        data: session,
      });
    } catch (error) { next(error); }
  }

  async updateSession(req, res, next) {
    try {
      const session = await pouchWeighingService.updateSession(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({
        success: true,
        message: 'Pouch weighing session updated successfully',
        data: session,
      });
    } catch (error) { next(error); }
  }

  async deleteSession(req, res, next) {
    try {
      await pouchWeighingService.deleteSession(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Pouch weighing session deleted successfully',
      });
    } catch (error) { next(error); }
  }

  async submitSession(req, res, next) {
    try {
      const session = await pouchWeighingService.submitSession(req.params.id, req.user.id);
      res.json({ success: true, message: 'Session submitted for lab approval', data: session });
    } catch (error) { next(error); }
  }

  async approveByLab(req, res, next) {
    try {
      const session = await pouchWeighingService.approveByLab(req.params.id, req.user.id);
      res.json({ success: true, message: 'Session approved by lab incharge', data: session });
    } catch (error) { next(error); }
  }

  async rejectByLab(req, res, next) {
    try {
      const session = await pouchWeighingService.rejectByLab(req.params.id, req.user.id);
      res.json({ success: true, message: 'Session rejected by lab incharge', data: session });
    } catch (error) { next(error); }
  }

  async approveByAdmin(req, res, next) {
    try {
      const session = await pouchWeighingService.approveByAdmin(req.params.id, req.user.id);
      res.json({ success: true, message: 'Session approved by admin', data: session });
    } catch (error) { next(error); }
  }

  async rejectByAdmin(req, res, next) {
    try {
      const session = await pouchWeighingService.rejectByAdmin(req.params.id, req.user.id);
      res.json({ success: true, message: 'Session rejected by admin', data: session });
    } catch (error) { next(error); }
  }
}

module.exports = new PouchWeighingController();
