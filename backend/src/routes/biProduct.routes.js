const express = require('express');
const router = express.Router();
const biProductController = require('../controllers/biProduct.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createBiProductValidator } = require('../validators/biProduct.validator');
const validate = require('../middlewares/validation.middleware');

const CAN_APPROVE = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];
const CAN_WRITE   = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];

// All routes require authentication
router.use(authenticate);

// GET all reports — all authenticated users can view
router.get('/', biProductController.getAllReports);

// GET single report
router.get('/:id', biProductController.getReportById);

// POST create — admin, lab_incharge, quality_incharge
router.post(
  '/',
  authorize(...CAN_WRITE),
  createBiProductValidator,
  validate,
  biProductController.createReport
);

// PUT update — admin, lab_incharge, quality_incharge
router.put(
  '/:id',
  authorize(...CAN_WRITE),
  biProductController.updateReport
);

// POST approve/reject — admin, lab_incharge, quality_incharge
router.post(
  '/:id/approve',
  authorize(...CAN_APPROVE),
  biProductController.approveReport
);

// DELETE — admin only
router.delete(
  '/:id',
  authorize('admin'),
  biProductController.deleteReport
);

module.exports = router;
