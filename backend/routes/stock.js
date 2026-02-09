const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// GET /api/stock/:symbol - Get current stock data
router.get('/:symbol', stockController.getStockData);

// GET /api/stock/:symbol/history - Get historical data
router.get('/:symbol/history', stockController.getStockHistory);

module.exports = router;
