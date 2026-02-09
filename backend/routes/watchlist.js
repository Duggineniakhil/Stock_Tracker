const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken); // Protect all routes

router.post('/', watchlistController.addToWatchlist);
router.get('/', watchlistController.getWatchlist);
router.delete('/:id', watchlistController.removeFromWatchlist);

module.exports = router;
