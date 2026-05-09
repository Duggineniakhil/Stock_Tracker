const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middleware/auth');

// Note: In a real production system, add a verifyAdmin middleware here.
// For this portfolio project, we will just use verifyToken.
router.use(verifyToken);

router.get('/stats', adminController.getStats);
router.get('/users/recent', adminController.getRecentUsers);

module.exports = router;
