import express from 'express';
import watchlistController from '../controllers/watchlistController';
import authenticateToken from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router.post('/', watchlistController.addToWatchlist);
router.get('/', watchlistController.getWatchlist);
router.delete('/:id', watchlistController.removeFromWatchlist);

export = router;
