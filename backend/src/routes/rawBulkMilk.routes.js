const express = require('express');
const router = express.Router();
const rawBulkMilkController = require('../controllers/rawBulkMilk.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createRawBulkMilkValidator } = require('../validators/rawBulkMilk.validator');
const validate = require('../middlewares/validation.middleware');

const CAN_APPROVE = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];
const CAN_WRITE   = ['admin', 'lab_incharge', 'quality_incharge', 'qc_manager'];

router.use(authenticate);

// GET list — all authenticated users
router.get('/', rawBulkMilkController.getAllRecords);

// GET single
router.get('/:id', rawBulkMilkController.getRecordById);

// POST create — admin, lab_incharge, quality_incharge
router.post('/', authorize(...CAN_WRITE), createRawBulkMilkValidator, validate, rawBulkMilkController.createRecord);

// PUT update — admin, lab_incharge, quality_incharge
router.put('/:id', authorize(...CAN_WRITE), rawBulkMilkController.updateRecord);

// POST approve/reject
router.post('/:id/approve', authorize(...CAN_APPROVE), rawBulkMilkController.approveRecord);

// DELETE — admin only
router.delete('/:id', authorize('admin'), rawBulkMilkController.deleteRecord);

module.exports = router;
