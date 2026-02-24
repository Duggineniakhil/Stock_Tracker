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
     * Get portfolio value history over time
     * Computes daily snapshots of total portfolio value using historical prices
     * @param {number} userId - User ID
     * @param {string} range - Time range ('1mo', '3mo', '1y')
     * @returns {Promise<Array>} Array of { date, value } points
     */
    getPortfolioHistory: async (userId, range = '1mo') => {
        try {
            const holdings = await portfolioModel.getHoldingsByUserId(userId);
            if (holdings.length === 0) return [];

            // Fetch historical data for all holdings in parallel
            const historicalDataMap = {};
            await Promise.all(
                holdings.map(async (holding) => {
                    try {
                        const history = await stockService.getHistoricalData(holding.symbol, range);
                        historicalDataMap[holding.symbol] = history || [];
                    } catch (err) {
                        historicalDataMap[holding.symbol] = [];
                    }
                })
            );

            // Build a set of all dates across all holdings
            const allDatesSet = new Set();
            Object.values(historicalDataMap).forEach(history => {
                history.forEach(point => {
                    const dateKey = point.date.split('T')[0];
                    allDatesSet.add(dateKey);
                });
            });

            const sortedDates = Array.from(allDatesSet).sort();
            if (sortedDates.length === 0) return [];

            // Build price lookup maps: symbol -> { dateKey -> price }
            const priceMaps = {};
            for (const [symbol, history] of Object.entries(historicalDataMap)) {
                priceMaps[symbol] = {};
                history.forEach(point => {
                    const dateKey = point.date.split('T')[0];
                    priceMaps[symbol][dateKey] = point.price;
                });
            }

            // Compute total portfolio value for each date
            const portfolioHistory = [];
            const lastKnownPrice = {};

            for (const dateKey of sortedDates) {
                let totalValue = 0;
                let hasData = false;

                for (const holding of holdings) {
                    // Only include holdings that were bought on or before this date
                    if (holding.buy_date && holding.buy_date > dateKey) continue;

                    const price = priceMaps[holding.symbol]?.[dateKey]
                        || lastKnownPrice[holding.symbol]
                        || holding.buy_price;

                    if (priceMaps[holding.symbol]?.[dateKey]) {
                        lastKnownPrice[holding.symbol] = priceMaps[holding.symbol][dateKey];
                    }

                    totalValue += holding.quantity * price;
                    hasData = true;
                }

                if (hasData && totalValue > 0) {
                    portfolioHistory.push({
                        date: dateKey,
                        value: parseFloat(totalValue.toFixed(2))
                    });
                }
            }

            return portfolioHistory;
        } catch (error) {
            console.error('Error computing portfolio history:', error.message);
            return [];
        }
    },

    /**
     * Get performance comparison data (normalized % returns per holding)
     * @param {number} userId - User ID
     * @param {string} range - Time range ('1mo', '3mo', '1y')
     * @returns {Promise<Array>} Array of { symbol, data: [{ date, returnPct }] }
     */
    getPortfolioPerformance: async (userId, range = '1mo') => {
        try {
            const holdings = await portfolioModel.getHoldingsByUserId(userId);
            if (holdings.length === 0) return [];

            // Sort by current value (estimated), take top 5
            const priced = await Promise.all(
                holdings.map(async (h) => {
                    const price = await portfolioService.getCachedStockPrice(h.symbol);
                    return { ...h, currentValue: h.quantity * price };
                })
            );
            const top = priced.sort((a, b) => b.currentValue - a.currentValue).slice(0, 5);

            const results = await Promise.all(
                top.map(async (holding) => {
                    try {
                        const history = await stockService.getHistoricalData(holding.symbol, range);
                        if (!history || history.length === 0) return null;

                        const basePrice = history[0].price;
                        if (!basePrice || basePrice === 0) return null;

                        const data = history.map(point => ({
                            date: point.date.split('T')[0],
                            returnPct: parseFloat((((point.price - basePrice) / basePrice) * 100).toFixed(2))
                        }));

                        return { symbol: holding.symbol, data };
                    } catch (err) {
                        return null;
                    }
                })
            );

            return results.filter(r => r !== null);
        } catch (error) {
            console.error('Error computing portfolio performance:', error.message);
            return [];
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
