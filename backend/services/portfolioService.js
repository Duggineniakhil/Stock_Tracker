const portfolioModel = require('../models/portfolioModel');
const stockService = require('./stockService');

/**
 * In-memory cache for stock prices
 * Simple caching to reduce API calls
 */
const priceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Portfolio Service - Business Logic Layer
 * Handles portfolio calculations and data enrichment
 */

const portfolioService = {
    /**
     * Get stock price with caching
     * @param {string} symbol - Stock symbol
     * @returns {Promise<number>} Current price
     */
    getCachedStockPrice: async (symbol) => {
        const cached = priceCache.get(symbol);
        const now = Date.now();

        // Return cached price if valid
        if (cached && (now - cached.timestamp < CACHE_TTL)) {
            return cached.price;
        }

        // Fetch fresh price
        try {
            const quote = await stockService.getStockQuote(symbol);
            const price = quote.regularMarketPrice || 0;

            // Cache it
            priceCache.set(symbol, {
                price,
                timestamp: now
            });

            return price;
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error.message);
            // Return cached price even if expired, or 0
            return cached ? cached.price : 0;
        }
    },

    /**
     * Calculate metrics for a single holding
     * @param {Object} holding - Holding data
     * @param {number} currentPrice - Current stock price
     * @returns {Object} Holding with calculated metrics
     */
    calculateHoldingMetrics: (holding, currentPrice) => {
        const totalInvestment = holding.quantity * holding.buy_price;
        const currentValue = holding.quantity * currentPrice;
        const profitLoss = currentValue - totalInvestment;
        const profitLossPercent = totalInvestment > 0
            ? (profitLoss / totalInvestment) * 100
            : 0;

        return {
            ...holding,
            currentPrice,
            totalInvestment: parseFloat(totalInvestment.toFixed(2)),
            currentValue: parseFloat(currentValue.toFixed(2)),
            profitLoss: parseFloat(profitLoss.toFixed(2)),
            profitLossPercent: parseFloat(profitLossPercent.toFixed(2))
        };
    },

    /**
     * Get complete portfolio with calculations
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Portfolio holdings with metrics
     */
    getPortfolio: async (userId) => {
        try {
            const holdings = await portfolioModel.getHoldingsByUserId(userId);

            if (holdings.length === 0) {
                return [];
            }

            // Fetch current prices for all holdings
            const enrichedHoldings = await Promise.all(
                holdings.map(async (holding) => {
                    const currentPrice = await portfolioService.getCachedStockPrice(holding.symbol);
                    return portfolioService.calculateHoldingMetrics(holding, currentPrice);
                })
            );

            return enrichedHoldings;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get portfolio summary with aggregated metrics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Summary metrics
     */
    getPortfolioSummary: async (userId) => {
        try {
            const portfolio = await portfolioService.getPortfolio(userId);

            if (portfolio.length === 0) {
                return {
                    totalHoldings: 0,
                    totalInvestment: 0,
                    totalCurrentValue: 0,
                    totalProfitLoss: 0,
                    totalProfitLossPercent: 0
                };
            }

            const totalInvestment = portfolio.reduce((sum, h) => sum + h.totalInvestment, 0);
            const totalCurrentValue = portfolio.reduce((sum, h) => sum + h.currentValue, 0);
            const totalProfitLoss = totalCurrentValue - totalInvestment;
            const totalProfitLossPercent = totalInvestment > 0
                ? (totalProfitLoss / totalInvestment) * 100
                : 0;

            return {
                totalHoldings: portfolio.length,
                totalInvestment: parseFloat(totalInvestment.toFixed(2)),
                totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
                totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
                totalProfitLossPercent: parseFloat(totalProfitLossPercent.toFixed(2))
            };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get portfolio allocation by symbol
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Allocation breakdown
     */
    getPortfolioAllocation: async (userId) => {
        try {
            const portfolio = await portfolioService.getPortfolio(userId);

            if (portfolio.length === 0) {
                return [];
            }

            const totalValue = portfolio.reduce((sum, h) => sum + h.currentValue, 0);

            const allocation = portfolio.map(holding => ({
                symbol: holding.symbol,
                currentValue: holding.currentValue,
                percentage: totalValue > 0
                    ? parseFloat(((holding.currentValue / totalValue) * 100).toFixed(2))
                    : 0
            }));

            // Sort by percentage descending
            return allocation.sort((a, b) => b.percentage - a.percentage);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Validate stock symbol exists
     * @param {string} symbol - Stock symbol
     * @returns {Promise<boolean>} True if valid
     */
    validateSymbol: async (symbol) => {
        try {
            const quote = await stockService.getStockQuote(symbol);
            return quote && quote.regularMarketPrice !== undefined;
        } catch (error) {
            return false;
        }
    }
};

module.exports = portfolioService;
