import express from 'express';
import stockController from '../controllers/stockController';

const router = express.Router();

// GET /api/stock/trending - Get trending assets
router.get('/trending', stockController.getTrending);

// GET /api/stock/:symbol - Get current stock data
router.get('/:symbol', stockController.getStockData);

// GET /api/stock/:symbol/history - Get historical data
router.get('/:symbol/history', stockController.getStockHistory);

export = router;
