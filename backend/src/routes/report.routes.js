const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All report routes require authentication
router.use(authenticate);

// All authenticated users can access reports
router.get('/daily', reportController.getDailyReport);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/custom', reportController.getCustomReport);
router.get('/approval-statistics', reportController.getApprovalStatistics);
router.get('/user-activity', reportController.getUserActivityReport);

module.exports = router;
