const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken); // Protect all routes

router.get('/', alertController.getAlerts);
router.post('/', alertController.createManualAlert);

module.exports = router;
