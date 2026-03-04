const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const interestController = require('../controllers/interestController');

// GET /api/interests should be public during profile setup
router.get('/', interestController.getAllInterests);

router.use(protect);

router.post('/', interestController.addCustomInterest);

module.exports = router;
