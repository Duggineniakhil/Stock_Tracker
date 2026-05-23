import express from 'express';
import authController from '../controllers/authController';
import verifyToken from '../middleware/auth';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/plan', verifyToken, authController.updatePlan);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/password', verifyToken, authController.changePassword);

export = router;
