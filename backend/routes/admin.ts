import express from 'express';
import adminController from '../controllers/adminController';
import verifyToken from '../middleware/auth';
import requireAdmin from '../middleware/requireAdmin';

const router = express.Router();

// Admins are the accounts whose emails are listed in ADMIN_EMAILS
router.use(verifyToken, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users/recent', adminController.getRecentUsers);

export = router;
