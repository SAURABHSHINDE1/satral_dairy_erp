const express = require('express');
const router = express.Router();
const tankController = require('../controllers/tank.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createTankRecordValidator, updateTankRecordValidator, approvalValidator } = require('../validators/tank.validator');
const validate = require('../middlewares/validation.middleware');

// All tank routes require authentication
router.use(authenticate);

// Get all records (all roles)
router.get('/', tankController.getAllTankRecords);
router.get('/statistics', tankController.getStatistics);
router.get('/daily-trend', tankController.getDailyTrend);

// Get single record (all roles)
router.get('/:id', tankController.getTankRecordById);

// Create record (all authenticated users can create)
router.post('/', createTankRecordValidator, validate, tankController.createTankRecord);

// Update record (operator can update own, admin can update all)
router.put('/:id', updateTankRecordValidator, validate, tankController.updateTankRecord);

// Delete record (lab incharge and admin only)
router.delete('/:id', authorize('lab_incharge', 'admin'), tankController.deleteTankRecord);

// Lab approval (lab incharge only)
router.post('/:id/approve-lab', authorize('lab_incharge'), approvalValidator, validate, tankController.approveByLab);
router.post('/:id/reject-lab', authorize('lab_incharge'), approvalValidator, validate, tankController.rejectByLab);

// Admin approval (admin only)
router.post('/:id/approve-admin', authorize('admin'), approvalValidator, validate, tankController.approveByAdmin);
router.post('/:id/reject-admin', authorize('admin'), approvalValidator, validate, tankController.rejectByAdmin);

module.exports = router;
