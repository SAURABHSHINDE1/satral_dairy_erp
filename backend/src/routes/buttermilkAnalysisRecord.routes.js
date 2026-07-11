const express = require('express');
const router = express.Router();
const buttermilkAnalysisRecordController = require('../controllers/buttermilkAnalysisRecord.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createButtermilkAnalysisRecordValidator } = require('../validators/buttermilkAnalysisRecord.validator');
const validate = require('../middlewares/validation.middleware');

const CAN_WRITE = ['admin', 'quality_incharge', 'lab_incharge', 'qc_manager'];

// All routes require authentication
router.use(authenticate);

// GET all records
router.get('/', buttermilkAnalysisRecordController.getAllRecords);

// GET single record by ID
router.get('/:id', buttermilkAnalysisRecordController.getRecordById);

// POST create record
router.post(
  '/',
  authorize(...CAN_WRITE),
  createButtermilkAnalysisRecordValidator,
  validate,
  buttermilkAnalysisRecordController.createRecord
);

// PUT update record by ID
router.put(
  '/:id',
  authorize(...CAN_WRITE),
  buttermilkAnalysisRecordController.updateRecord
);

module.exports = router;
