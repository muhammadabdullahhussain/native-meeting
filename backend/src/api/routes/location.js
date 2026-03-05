const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// @route   GET api/location/search
router.get('/search', locationController.search);

// @route   GET api/location/reverse
router.get('/reverse', locationController.reverse);

module.exports = router;
