const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { loginValidator, refreshTokenValidator } = require('../validators/auth.validator');
const validate = require('../middlewares/validation.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/refresh', refreshTokenValidator, validate, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
