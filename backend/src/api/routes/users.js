const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/users/discover
 * @access  Private
 */
router.get('/discover', protect, userController.getDiscover);
router.post('/upgrade', protect, userController.upgradeToPremium);
router.get('/:id', protect, userController.getUser);

module.exports = router;
