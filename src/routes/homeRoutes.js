const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Home Page Route
router.get('/', homeController.getHomePage);

module.exports = router;
