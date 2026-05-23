import express from 'express';
import aiController from '../controllers/aiController';
import authMiddleware from '../middleware/auth';

const router = express.Router();

/**
 * AI Routes
 * Protected endpoints for AI features
 */
router.use(authMiddleware);

// Chat endpoints
router.post('/chat', aiController.chat);
router.get('/chat/history', aiController.getChatHistory);

// Analysis endpoints
router.get('/sentiment/:symbol', aiController.getSentiment);

// Report endpoints
router.post('/report/generate', aiController.generateReport);
router.get('/report/latest', aiController.getLatestReport);

export = router;
