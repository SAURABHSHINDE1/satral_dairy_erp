const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All activity routes require authentication
router.use(authenticate);

// Get all activities (admin only)
router.get('/', authorize('admin'), activityController.getAllActivities);
router.get('/count', authorize('admin'), activityController.getActivityCount);

module.exports = router;
