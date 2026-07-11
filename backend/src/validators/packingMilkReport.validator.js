const { body } = require('express-validator');

const createPackingMilkReportValidator = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('tank_no')
    .trim()
    .notEmpty().withMessage('Tank No. is required')
    .isLength({ max: 50 }).withMessage('Tank No. must not exceed 50 characters'),

  body('batch_no')
    .trim()
    .notEmpty().withMessage('Batch No. is required')
    .isLength({ max: 50 }).withMessage('Batch No. must not exceed 50 characters'),

  body('packing_head')
    .trim()
    .notEmpty().withMessage('Packing Head is required')
    .isLength({ max: 100 }).withMessage('Packing Head must not exceed 100 characters'),

  body('product_name')
    .trim()
    .notEmpty().withMessage('Product Name is required')
    .isLength({ max: 100 }).withMessage('Product Name must not exceed 100 characters'),

  body('testing_time')
    .optional({ checkFalsy: true })
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid testing time format (expected HH:MM or HH:MM:SS)'),

  body('temp_celsius')
    .optional({ checkFalsy: true }).isFloat({ min: -10, max: 100 }).withMessage('Temperature must be between -10 and 100'),

  body('acidity_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Acidity must be between 0 and 100'),

  body('alcohol_result')
    .optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Alcohol result must not exceed 50 characters'),

  body('fat_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('FAT % must be between 0 and 100'),

  body('clr')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('CLR must be a positive number'),

  body('snf_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('SNF % must be between 0 and 100'),

  body('phosphatase_test')
    .optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Phosphatase test result must not exceed 50 characters'),

  body('br')
    .optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('BR must be a positive number'),

  body('ph')
    .optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 14 }).withMessage('pH must be between 0 and 14'),

  body('ts')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('TS must be between 0 and 100'),

  body('protein_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Protein % must be between 0 and 100'),

  body('chemist_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Chemist name must not exceed 100 characters'),

  body('quality_incharge_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Quality incharge name must not exceed 100 characters'),
];

module.exports = { createPackingMilkReportValidator };
