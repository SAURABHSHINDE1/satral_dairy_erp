const { body } = require('express-validator');

const createFinalProductValidator = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('shift')
    .notEmpty().withMessage('Shift is required')
    .isIn(['morning', 'evening', 'night']).withMessage('Shift must be morning, evening, or night'),

  body('tank_no')
    .trim()
    .notEmpty().withMessage('Tank number is required')
    .isLength({ min: 1, max: 20 }).withMessage('Tank number must be between 1 and 20 characters'),

  body('type_of_milk')
    .notEmpty().withMessage('Type of milk is required')
    .isIn(['cow', 'buffalo', 'mixed']).withMessage('Type of milk must be cow, buffalo, or mixed'),

  body('testing_time')
    .optional({ checkFalsy: true })
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid testing time format (expected HH:MM or HH:MM:SS)'),

  body('milk_quantity_l')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Milk quantity must be a positive number'),

  body('temp_celsius')
    .optional({ checkFalsy: true }).isFloat({ min: -10, max: 100 }).withMessage('Temperature must be between -10 and 100'),

  body('flavour_taste')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Flavour/Taste must not exceed 100 characters'),

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

  body('efficiency_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Efficiency % must be between 0 and 100'),

  body('protein_percent')
    .optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Protein % must be between 0 and 100'),

  body('electrolyte_condition')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Electrolyte condition must not exceed 100 characters'),

  body('remark')
    .optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Remark must not exceed 1000 characters'),

  body('chemist_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Chemist name must not exceed 100 characters'),

  body('quality_incharge_name')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Quality incharge name must not exceed 100 characters'),
];

const updateFinalProductValidator = createFinalProductValidator.map((v) => {
  // Make all fields optional for update
  return v.optional ? v : v;
});

module.exports = {
  createFinalProductValidator,
  updateFinalProductValidator: createFinalProductValidator.map((rule) =>
    rule.optional ? rule : rule
  ),
};
