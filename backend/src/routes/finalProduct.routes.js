const express = require('express');
const router = express.Router();
const finalProductController = require('../controllers/finalProduct.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createFinalProductValidator } = require('../validators/finalProduct.validator');
const validate = require('../middlewares/validation.middleware');

const CAN_APPROVE = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];
const CAN_WRITE   = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];

// All routes require authentication
router.use(authenticate);

// GET list (all authenticated users can view)
router.get('/', finalProductController.getAllRecords);

// GET single record
router.get('/:id', finalProductController.getRecordById);

// POST create — admin, lab_incharge, quality_incharge
router.post(
  '/',
  authorize(...CAN_WRITE),
  createFinalProductValidator,
  validate,
  finalProductController.createRecord
);

// PUT update — admin, lab_incharge, quality_incharge
router.put(
  '/:id',
  authorize(...CAN_WRITE),
  finalProductController.updateRecord
);

// POST approve/reject — admin, lab_incharge, quality_incharge
router.post(
  '/:id/approve',
  authorize(...CAN_APPROVE),
  finalProductController.approveRecord
);

// DELETE — admin only
router.delete(
  '/:id',
  authorize('admin'),
  finalProductController.deleteRecord
);

module.exports = router;
