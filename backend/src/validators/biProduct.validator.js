const { body } = require('express-validator');

const createBiProductValidator = [
  body('batch_no')
    .trim()
    .notEmpty().withMessage('Batch number is required')
    .isLength({ max: 50 }).withMessage('Batch number must not exceed 50 characters'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('product_name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Product name must not exceed 100 characters'),

  body('body_structure')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Body/Structure must not exceed 100 characters'),

  body('sensory')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Sensory must not exceed 100 characters'),

  body('taste')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Taste must not exceed 100 characters'),

  body('temp_celsius')
    .optional({ checkFalsy: true }).isFloat({ min: -20, max: 120 }).withMessage('Temperature must be between -20 and 120'),

  body('acidity_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Acidity must be between 0 and 100'),

  body('ph')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 14 }).withMessage('pH must be between 0 and 14'),

  body('self_life')
    .optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Self life must not exceed 50 characters'),

  body('fdm')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('FDM must be between 0 and 100'),

  body('fat_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('FAT % must be between 0 and 100'),

  body('ts')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('TS must be between 0 and 100'),

  body('lassi_viscosity')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Lassi viscosity must be a positive number'),

  body('moisture')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Moisture must be between 0 and 100'),

  body('chemist_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Chemist name must not exceed 100 characters'),

  body('quality_incharge_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Quality incharge name must not exceed 100 characters'),
];

module.exports = { createBiProductValidator };
