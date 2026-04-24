const stockService = require('../services/stockService');
const { success, error: apiError } = require('../utils/responseWrapper');

const stockController = {
    // Get current stock data
    getStockData: async (req, res) => {
        try {
            const { symbol } = req.params;

            const quote = await stockService.getStockQuote(symbol);
            return success(res, quote, 'Stock data fetched successfully');
        } catch (error) {
            console.error('Error fetching stock data:', error);

            if (error.message.includes('Invalid stock symbol')) {
                return apiError(res, 'Stock symbol not found', null, 404);
            }

            return apiError(res, `Failed to fetch stock data: ${error.message}`, null, error.statusCode || 500);
        }
    },

    // Get historical stock data
    getStockHistory: async (req, res) => {
        try {
            const { symbol } = req.params;
            const range = req.query.range || '1mo'; // Default to 1 month

            const historicalData = await stockService.getHistoricalData(symbol, range);
            return success(res, historicalData, 'Historical data fetched successfully');
        } catch (error) {
            console.error('Error fetching historical data:', error);
            return apiError(res, 'Failed to fetch historical data', null, 500);
        }
    }
};

module.exports = stockController;
