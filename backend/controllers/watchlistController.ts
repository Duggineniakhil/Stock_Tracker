import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import watchlistModel from '../models/watchlistModel';
import stockService from '../services/stockService';
import { success, error as apiError } from '../utils/responseWrapper';

const watchlistController = {
    // Add stock to watchlist
    addToWatchlist: async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id;
            const { symbol } = req.body;

            if (!symbol) {
                return apiError(res, 'Stock symbol is required', null, 400);
            }

            // Validate symbol
            try {
                await stockService.getStockQuote(symbol);
            } catch (error: any) {
                const status = error.statusCode || 400;
                const message = error.message === 'Invalid stock symbol' ? error.message : 'Stock service currently unavailable';
                return apiError(res, message, null, status);
            }

            // Check if already in watchlist
            const existing = await watchlistModel.getStockBySymbol(userId, symbol);
            if (existing) {
                return apiError(res, 'Stock already in watchlist', null, 409);
            }

            const result = await watchlistModel.addStock(userId, symbol);
            return success(res, result, 'Stock added to watchlist', 201);
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            return apiError(res, 'Failed to add stock to watchlist', null, 500);
        }
    },

    // Get all watchlist stocks
    getWatchlist: async (req: AuthenticatedRequest, res: Response) => {
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

            return success(res, watchlistWithPrices, 'Watchlist fetched successfully');
        } catch (error) {
            console.error('Error getting watchlist:', error);
            return apiError(res, 'Failed to fetch watchlist', null, 500);
        }
    },

    // Remove stock
    removeFromWatchlist: async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const result = await watchlistModel.removeStock(userId, id);

            if (result.changes === 0) {
                return apiError(res, 'Stock not found in watchlist', null, 404);
            }

            return success(res, null, 'Stock removed from watchlist');
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            return apiError(res, 'Failed to remove stock from watchlist', null, 500);
        }
    }
};

export default watchlistController;
export const addToWatchlist = watchlistController.addToWatchlist;
export const getWatchlist = watchlistController.getWatchlist;
export const removeFromWatchlist = watchlistController.removeFromWatchlist;
