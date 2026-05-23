import { Request, Response } from 'express';
import stockService from '../services/stockService';
import { success, error as apiError } from '../utils/responseWrapper';

const stockController = {
    // Get current stock data
    getStockData: async (req: Request, res: Response) => {
        try {
            const { symbol } = req.params;

            const quote = await stockService.getStockQuote(symbol);
            return success(res, quote, 'Stock data fetched successfully');
        } catch (error: any) {
            console.error('Error fetching stock data:', error);

            if (error.message?.includes('Invalid stock symbol')) {
                return apiError(res, 'Stock symbol not found', null, 404);
            }

            return apiError(res, `Failed to fetch stock data: ${error.message}`, null, error.statusCode || 500);
        }
    },

    // Get historical stock data
    getStockHistory: async (req: Request, res: Response) => {
        try {
            const { symbol } = req.params;
            const range = (req.query.range as string) || '1mo'; // Default to 1 month

            const historicalData = await stockService.getHistoricalData(symbol, range);
            return success(res, historicalData, 'Historical data fetched successfully');
        } catch (error: any) {
            console.error('Error fetching historical data:', error);
            return apiError(res, 'Failed to fetch historical data', null, 500);
        }
    },

    // Get trending assets
    getTrending: async (req: Request, res: Response) => {
        try {
            const region = (req.query.region as string) || 'US';
            const trending = await stockService.getTrendingStocks(region);
            return success(res, trending, 'Trending assets fetched successfully');
        } catch (error: any) {
            console.error('Error in trending endpoint:', error);
            return apiError(res, 'Failed to fetch trending assets', null, 500);
        }
    }
};

export default stockController;
export const getStockData = stockController.getStockData;
export const getStockHistory = stockController.getStockHistory;
export const getTrending = stockController.getTrending;
