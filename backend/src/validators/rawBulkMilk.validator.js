const { body } = require('express-validator');

const createRawBulkMilkValidator = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('sample_name')
    .trim()
    .notEmpty().withMessage('Sample name is required')
    .isLength({ max: 100 }).withMessage('Sample name must not exceed 100 characters'),

  body('type_of_milk')
    .trim()
    .notEmpty().withMessage('Type of milk is required')
    .isLength({ max: 50 }).withMessage('Type of milk must not exceed 50 characters'),

  body('testing_time')
    .optional({ checkFalsy: true })
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid testing time format (expected HH:MM or HH:MM:SS)'),

  body('milk_quantity_lit')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Milk quantity must be a positive number'),

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

  body('snf')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('SNF must be between 0 and 100'),

  body('protein_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Protein % must be between 0 and 100'),

  body('sodium_electrolyte_condition')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Sodium/Electrolyte condition must not exceed 100 characters'),

  body('ph')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 14 }).withMessage('pH must be between 0 and 14'),

  body('chemist_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Chemist name must not exceed 100 characters'),

  body('quality_incharge_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Quality incharge name must not exceed 100 characters'),
];

module.exports = { createRawBulkMilkValidator };
