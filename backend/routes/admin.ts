import express from 'express';
import adminController from '../controllers/adminController';
import verifyToken from '../middleware/auth';

const router = express.Router();

// Note: In a real production system, add a verifyAdmin middleware here.
// For this portfolio project, we will just use verifyToken.
router.use(verifyToken);

router.get('/stats', adminController.getStats);
router.get('/users/recent', adminController.getRecentUsers);

export = router;
