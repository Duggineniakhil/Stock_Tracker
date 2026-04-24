const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

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

module.exports = router;
