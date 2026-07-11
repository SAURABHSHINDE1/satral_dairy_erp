const activityRepository = require('../repositories/activity.repository');

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

class ActivityController {
  async getAllActivities(req, res, next) {
    try {
      const filters = {
        user_id: req.query.user_id,
        action: req.query.action,
        entity_type: req.query.entity_type,
        date_from: formatDate(req.query.date_from),
        date_to: formatDate(req.query.date_to),
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0
      };

      const activities = await activityRepository.findAll(filters);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityCount(req, res, next) {
    try {
      const filters = {
        user_id: req.query.user_id,
        action: req.query.action,
        entity_type: req.query.entity_type
      };

      const count = await activityRepository.count(filters);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityController();
