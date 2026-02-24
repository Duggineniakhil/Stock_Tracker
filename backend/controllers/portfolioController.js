const portfolioModel = require('../models/portfolioModel');
const portfolioService = require('../services/portfolioService');
const { success, error } = require('../utils/responseWrapper');

/**
 * Portfolio Controller - Request Handlers
 * Handles HTTP requests for portfolio management
 */

const portfolioController = {
    /**
     * Add a new holding to user's portfolio
     * POST /api/portfolio
     */
    addHolding: async (req, res) => {
        try {
            const userId = req.user.id; // From auth middleware
            const { symbol, quantity, buyPrice, buyDate } = req.body;

            // Validate symbol exists
            const isValid = await portfolioService.validateSymbol(symbol);
            if (!isValid) {
                return error(res, `Invalid stock symbol: ${symbol}`, null, 400);
            }

            // Create holding
            const holding = await portfolioModel.createHolding(
                userId,
                symbol,
                quantity,
                buyPrice,
                buyDate
            );

            return success(res, holding, 'Holding added successfully', 201);
        } catch (err) {
            console.error('Error adding holding:', err);
            return error(res, 'Failed to add holding', null, 500);
        }
    },

    /**
     * Get user's complete portfolio with calculations
     * GET /api/portfolio
     */
    getPortfolio: async (req, res) => {
        try {
            const userId = req.user.id;
            const portfolio = await portfolioService.getPortfolio(userId);

            return success(res, portfolio, 'Portfolio fetched successfully');
        } catch (err) {
            console.error('Error fetching portfolio:', err);
            return error(res, 'Failed to fetch portfolio', null, 500);
        }
    },

    /**
     * Get portfolio summary with aggregated metrics
     * GET /api/portfolio/summary
     */
    getSummary: async (req, res) => {
        try {
            const userId = req.user.id;
            const summary = await portfolioService.getPortfolioSummary(userId);

            return success(res, summary, 'Portfolio summary fetched successfully');
        } catch (err) {
            console.error('Error fetching summary:', err);
            return error(res, 'Failed to fetch portfolio summary', null, 500);
        }
    },

    /**
     * Get portfolio allocation breakdown
     * GET /api/portfolio/allocation
     */
    getAllocation: async (req, res) => {
        try {
            const userId = req.user.id;
            const allocation = await portfolioService.getPortfolioAllocation(userId);

            return success(res, allocation, 'Portfolio allocation fetched successfully');
        } catch (err) {
            console.error('Error fetching allocation:', err);
            return error(res, 'Failed to fetch portfolio allocation', null, 500);
        }
    },

    /**
     * Get a single holding by ID
     * GET /api/portfolio/:id
     */
    getHoldingById: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const holding = await portfolioModel.getHoldingById(id, userId);

            if (!holding) {
                return error(res, 'Holding not found', null, 404);
            }

            return success(res, holding, 'Holding fetched successfully');
        } catch (err) {
            console.error('Error fetching holding:', err);
            return error(res, 'Failed to fetch holding', null, 500);
        }
    },

    /**
     * Update a holding
     * PUT /api/portfolio/:id
     */
    updateHolding: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const updates = req.body;

            // If symbol is being updated, validate it
            if (updates.symbol) {
                const isValid = await portfolioService.validateSymbol(updates.symbol);
                if (!isValid) {
                    return error(res, `Invalid stock symbol: ${updates.symbol}`, null, 400);
                }
            }

            const updatedHolding = await portfolioModel.updateHolding(id, userId, updates);

            return success(res, updatedHolding, 'Holding updated successfully');
        } catch (err) {
            console.error('Error updating holding:', err);

            if (err.message.includes('not found') || err.message.includes('unauthorized')) {
                return error(res, err.message, null, 404);
            }

            return error(res, 'Failed to update holding', null, 500);
        }
    },

    /**
     * Get portfolio value history over time
     * GET /api/portfolio/history?range=1mo
     */
    getHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const range = req.query.range || '1mo';
            const history = await portfolioService.getPortfolioHistory(userId, range);
            return success(res, history, 'Portfolio history fetched successfully');
        } catch (err) {
            console.error('Error fetching portfolio history:', err);
            return error(res, 'Failed to fetch portfolio history', null, 500);
        }
    },

    /**
     * Get performance comparison data for holdings
     * GET /api/portfolio/performance?range=1mo
     */
    getPerformance: async (req, res) => {
        try {
            const userId = req.user.id;
            const range = req.query.range || '1mo';
            const performance = await portfolioService.getPortfolioPerformance(userId, range);
            return success(res, performance, 'Portfolio performance fetched successfully');
        } catch (err) {
            console.error('Error fetching portfolio performance:', err);
            return error(res, 'Failed to fetch portfolio performance', null, 500);
        }
    },

    /**
     * Delete a holding
     * DELETE /api/portfolio/:id
     */
    deleteHolding: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            await portfolioModel.deleteHolding(id, userId);

            return success(res, null, 'Holding deleted successfully');
        } catch (err) {
            console.error('Error deleting holding:', err);

            if (err.message.includes('not found') || err.message.includes('unauthorized')) {
                return error(res, err.message, null, 404);
            }

            return error(res, 'Failed to delete holding', null, 500);
        }
    }
};

module.exports = portfolioController;
