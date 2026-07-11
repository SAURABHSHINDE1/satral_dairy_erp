const { body } = require('express-validator');

const createButtermilkAnalysisRecordValidator = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('shift')
    .trim()
    .notEmpty().withMessage('Shift is required')
    .isIn(['Morning', 'Evening']).withMessage('Shift must be Morning or Evening'),

  body('type_of_sample')
    .trim()
    .notEmpty().withMessage('Type of sample is required'),

  body('testing_time')
    .trim()
    .notEmpty().withMessage('Testing time is required'),

  body('batch_no')
    .trim()
    .notEmpty().withMessage('Batch No. is required'),

  body('packing_date')
    .trim()
    .notEmpty().withMessage('Packing date is required'),

  body('expiry_date')
    .trim()
    .notEmpty().withMessage('Expiry date is required'),

  body('flavour')
    .trim()
    .notEmpty().withMessage('Flavour is required'),

  body('taste')
    .trim()
    .notEmpty().withMessage('Taste is required'),

  body('fat_percent')
    .trim()
    .notEmpty().withMessage('FAT % is required'),

  body('degree')
    .trim()
    .notEmpty().withMessage('Degree is required'),

  body('acidity_percent')
    .trim()
    .notEmpty().withMessage('Acidity % is required'),

  body('protein_percent')
    .trim()
    .notEmpty().withMessage('Protein % is required'),

  body('adulteration')
    .trim()
    .notEmpty().withMessage('Adulteration is required'),

  body('remark')
    .trim()
    .notEmpty().withMessage('Remark is required'),

  body('sign_name')
    .trim()
    .notEmpty().withMessage('Sign / Name is required'),

  body('chemist_name')
    .trim()
    .notEmpty().withMessage('Chemist name is required'),

  body('quality_incharge_name')
    .trim()
    .notEmpty().withMessage('Quality incharge name is required')
];

module.exports = { createButtermilkAnalysisRecordValidator };
