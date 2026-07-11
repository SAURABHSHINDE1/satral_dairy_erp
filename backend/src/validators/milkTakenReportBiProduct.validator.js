const { body } = require('express-validator');

const createMilkTakenReportBiProductValidator = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('product_name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Product name must not exceed 100 characters'),

  body('testing_time')
    .optional({ checkFalsy: true })
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid testing time format (expected HH:MM or HH:MM:SS)'),

  body('temp_celsius')
    .optional({ checkFalsy: true }).isFloat({ min: -10, max: 100 }).withMessage('Temperature must be between -10 and 100'),

  body('ot')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('OT must be a positive number'),

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

  body('neutralizer_adultration')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Neutralizer/Adultration must not exceed 100 characters'),

  body('sodium_electrolyte_condition')
    .optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Sodium/Electrolyte condition must not exceed 100 characters'),

  body('ph')
    .optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 14 }).withMessage('pH must be between 0 and 14'),

  body('chemist_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Chemist name must not exceed 100 characters'),

  body('qc_manager_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('QC Manager name must not exceed 100 characters'),
];

module.exports = { createMilkTakenReportBiProductValidator };
