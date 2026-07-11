const { body } = require('express-validator');

const createTankRecordValidator = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('tank_number')
    .trim()
    .notEmpty()
    .withMessage('Tank number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Tank number must be between 1 and 20 characters'),
  
  body('batch_number')
    .trim()
    .notEmpty()
    .withMessage('Batch number is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Batch number must be between 1 and 50 characters'),
  
  body('milk_quantity')
    .notEmpty()
    .withMessage('Milk quantity is required')
    .isFloat({ min: 0 })
    .withMessage('Milk quantity must be a positive number'),
  
  body('fat_percentage')
    .notEmpty()
    .withMessage('FAT percentage is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('FAT percentage must be between 0 and 100'),
  
  body('snf_percentage')
    .notEmpty()
    .withMessage('SNF percentage is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('SNF percentage must be between 0 and 100'),
  
  body('temperature')
    .notEmpty()
    .withMessage('Temperature is required')
    .isFloat({ min: -10, max: 50 })
    .withMessage('Temperature must be between -10 and 50'),
  
  body('milk_type')
    .notEmpty()
    .withMessage('Milk type is required')
    .isIn(['cow', 'buffalo', 'mixed'])
    .withMessage('Milk type must be cow, buffalo, or mixed'),
  
  body('tank_release_time')
    .optional()
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid tank release time format (expected HH:MM or HH:MM:SS)'),
  
  body('packing_machine_detail')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Packing machine detail must not exceed 255 characters'),
  
  body('release_time')
    .optional()
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid release time format (expected HH:MM or HH:MM:SS)'),
  
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must not exceed 1000 characters')
];

const updateTankRecordValidator = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('tank_number')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Tank number must be between 1 and 20 characters'),
  
  body('batch_number')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Batch number must be between 1 and 50 characters'),
  
  body('milk_quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Milk quantity must be a positive number'),
  
  body('fat_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('FAT percentage must be between 0 and 100'),
  
  body('snf_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('SNF percentage must be between 0 and 100'),
  
  body('temperature')
    .optional()
    .isFloat({ min: -10, max: 50 })
    .withMessage('Temperature must be between -10 and 50'),
  
  body('milk_type')
    .optional()
    .isIn(['cow', 'buffalo', 'mixed'])
    .withMessage('Milk type must be cow, buffalo, or mixed'),
  
  body('tank_release_time')
    .optional()
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid tank release time format (expected HH:MM or HH:MM:SS)'),
  
  body('packing_machine_detail')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Packing machine detail must not exceed 255 characters'),
  
  body('release_time')
    .optional()
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Invalid release time format (expected HH:MM or HH:MM:SS)'),
  
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must not exceed 1000 characters')
];

const approvalValidator = [
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters')
];

module.exports = {
  createTankRecordValidator,
  updateTankRecordValidator,
  approvalValidator
};
