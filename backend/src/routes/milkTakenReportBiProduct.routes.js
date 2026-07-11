const express = require('express');
const router  = express.Router();
const milkTakenReportBiProductController = require('../controllers/milkTakenReportBiProduct.controller');
const { authenticate, authorize }         = require('../middlewares/auth.middleware');
const { createMilkTakenReportBiProductValidator } = require('../validators/milkTakenReportBiProduct.validator');
const validate = require('../middlewares/validation.middleware');

const CAN_WRITE = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];

// All routes require authentication
router.use(authenticate);

// GET list — all authenticated users can view
router.get('/', milkTakenReportBiProductController.getAllRecords);

// GET single record
router.get('/:id', milkTakenReportBiProductController.getRecordById);

// POST create — admin, lab_incharge, quality_incharge
router.post(
  '/',
  authorize(...CAN_WRITE),
  createMilkTakenReportBiProductValidator,
  validate,
  milkTakenReportBiProductController.createRecord
);

// PUT update — admin, lab_incharge, quality_incharge
router.put(
  '/:id',
  authorize(...CAN_WRITE),
  milkTakenReportBiProductController.updateRecord
);

// DELETE — admin only
router.delete(
  '/:id',
  authorize('admin'),
  milkTakenReportBiProductController.deleteRecord
);

module.exports = router;
