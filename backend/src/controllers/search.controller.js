const searchService = require('../services/search.service');

class SearchController {
  async globalSearch(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json({ success: true, data: {} });
      }
      const results = await searchService.globalSearch(q);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
