const stockService = require('../services/stockService');

const stockController = {
    // Get current stock data
    getStockData: async (req, res) => {
        try {
            const { symbol } = req.params;

            const quote = await stockService.getStockQuote(symbol);
            res.json(quote);
        } catch (error) {
            console.error('Error fetching stock data:', error);

            if (error.message.includes('Invalid stock symbol')) {
                return res.status(404).json({ error: 'Stock symbol not found' });
            }

            res.status(500).json({ error: 'Failed to fetch stock data' });
        }
    },

    // Get historical stock data
    getStockHistory: async (req, res) => {
        try {
            const { symbol } = req.params;
            const range = req.query.range || '1mo'; // Default to 1 month

            const historicalData = await stockService.getHistoricalData(symbol, range);
            res.json(historicalData);
        } catch (error) {
            console.error('Error fetching historical data:', error);
            res.status(500).json({ error: 'Failed to fetch historical data' });
        }
    }
};

module.exports = stockController;
