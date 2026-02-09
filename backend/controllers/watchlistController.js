const watchlistModel = require('../models/watchlistModel');
const stockService = require('../services/stockService');

const watchlistController = {
    // Add stock to watchlist
    addToWatchlist: async (req, res) => {
        try {
            const userId = req.user.id;
            const { symbol } = req.body;

            if (!symbol) {
                return res.status(400).json({ error: 'Stock symbol is required' });
            }

            // Validate symbol
            try {
                await stockService.getStockQuote(symbol);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid stock symbol' });
            }

            // Check if already in watchlist
            const existing = await watchlistModel.getStockBySymbol(userId, symbol);
            if (existing) {
                return res.status(409).json({ error: 'Stock already in watchlist' });
            }

            const result = await watchlistModel.addStock(userId, symbol);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            res.status(500).json({ error: 'Failed to add stock to watchlist' });
        }
    },

    // Get all watchlist stocks
    getWatchlist: async (req, res) => {
        try {
            const userId = req.user.id;
            const watchlist = await watchlistModel.getAllStocks(userId);

            const watchlistWithPrices = await Promise.all(
                watchlist.map(async (stock) => {
                    try {
                        const quote = await stockService.getStockQuote(stock.symbol);
                        return { ...stock, ...quote };
                    } catch (error) {
                        return { ...stock, error: 'Failed to fetch current price' };
                    }
                })
            );

            res.json(watchlistWithPrices);
        } catch (error) {
            console.error('Error getting watchlist:', error);
            res.status(500).json({ error: 'Failed to fetch watchlist' });
        }
    },

    // Remove stock
    removeFromWatchlist: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const result = await watchlistModel.removeStock(userId, id);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Stock not found in watchlist' });
            }

            res.json({ message: 'Stock removed from watchlist' });
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            res.status(500).json({ error: 'Failed to remove stock from watchlist' });
        }
    }
};

module.exports = watchlistController;
