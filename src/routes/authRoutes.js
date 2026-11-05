const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.post('/signup', authController.signup);
router.post('/register', authController.signup); // friendly alias
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);

module.exports = router;
