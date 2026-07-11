const express = require('express');
const router  = express.Router();
const packingMilkReportController = require('../controllers/packingMilkReport.controller');
const { authenticate, authorize }  = require('../middlewares/auth.middleware');
const { createPackingMilkReportValidator } = require('../validators/packingMilkReport.validator');
const validate = require('../middlewares/validation.middleware');

const CAN_WRITE = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];

// All routes require authentication
router.use(authenticate);

// GET list — all authenticated users can view
router.get('/', packingMilkReportController.getAllRecords);

// GET single record
router.get('/:id', packingMilkReportController.getRecordById);

// POST create — admin, lab_incharge, quality_incharge
router.post(
  '/',
  authorize(...CAN_WRITE),
  createPackingMilkReportValidator,
  validate,
  packingMilkReportController.createRecord
);

// PUT update — admin, lab_incharge, quality_incharge
router.put(
  '/:id',
  authorize(...CAN_WRITE),
  packingMilkReportController.updateRecord
);

// DELETE — admin only
router.delete(
  '/:id',
  authorize('admin'),
  packingMilkReportController.deleteRecord
);

module.exports = router;
