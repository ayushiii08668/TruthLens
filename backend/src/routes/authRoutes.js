const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../validators/authValidators');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, profile management, and password reset
 */

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, updateProfileValidator, validate, authController.updateProfile);
router.post('/logout', protect, authController.logout);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validate, authController.resetPassword);

module.exports = router;

