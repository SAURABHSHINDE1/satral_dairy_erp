const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createUserValidator, updateUserValidator } = require('../validators/user.validator');
const validate = require('../middlewares/validation.middleware');

// All user routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/statistics', authorize('admin'), userController.getUserStatistics);
router.post('/', authorize('admin'), createUserValidator, validate, userController.createUser);
router.put('/:id', authorize('admin'), updateUserValidator, validate, userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

// All authenticated users can get user by ID
router.get('/:id', userController.getUserById);

module.exports = router;
