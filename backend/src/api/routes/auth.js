const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/auth/register
router.post('/register', authController.register);

// @route   POST api/auth/login
router.post('/login', authController.login);

// @route   POST api/auth/check-email
router.post('/check-email', authController.checkEmail);

// @route   GET api/auth/referral/validate/:code
router.get('/referral/validate/:code', authController.validateReferral);

// @route   GET api/auth/me
router.get('/me', protect, authController.getMe);

// @route   PATCH api/auth/me
router.patch('/me', protect, authController.updateMe);

// @route   PATCH api/auth/settings
router.patch('/settings', protect, authController.updateSettings);

// @route   PATCH api/auth/change-password
router.patch('/change-password', protect, authController.changePassword);

// @route   DELETE api/auth/me
router.delete('/me', protect, authController.deleteMe);

module.exports = router;
