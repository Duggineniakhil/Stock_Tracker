import portfolioModel from '../models/portfolioModel';
import stockService from './stockService';

type Holding = {
    id?: number;
    symbol: string;
    quantity: number;
    buy_price: number;
    buy_date?: string;
    [key: string]: any;
};

type EnrichedHolding = Holding & {
    currentPrice: number;
    totalInvestment: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
};

type PriceCacheEntry = { price: number; timestamp: number };

/**
 * In-memory cache for stock prices
 * Simple caching to reduce API calls
 */
const priceCache = new Map<string, PriceCacheEntry>();
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
    getCachedStockPrice: async (symbol: string): Promise<number> => {
        const cached = priceCache.get(symbol);
        const now = Date.now();

        // Return cached price if valid
        if (cached && (now - cached.timestamp < CACHE_TTL)) {
            return cached.price;
        }

        // Fetch fresh price
        try {
            const quote = await stockService.getStockQuote(symbol);
            const price = quote.currentPrice || 0;

            // Cache it
            priceCache.set(symbol, {
                price,
                timestamp: now
            });

            return price;
        } catch (error: any) {
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
    calculateHoldingMetrics: (holding: Holding, currentPrice: number): EnrichedHolding => {
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
    getPortfolio: async (userId: number): Promise<EnrichedHolding[]> => {
        try {
            const holdings = await portfolioModel.getHoldingsByUserId(userId);

            if (holdings.length === 0) {
                return [];
            }

            // Fetch current prices for all holdings
            const enrichedHoldings = await Promise.all(
                holdings.map(async (holding: Holding) => {
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
    getPortfolioSummary: async (userId: number) => {
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
    getPortfolioAllocation: async (userId: number) => {
        try {
            const portfolio = await portfolioService.getPortfolio(userId);

            if (portfolio.length === 0) {
                return [];
            }

            const totalValue = portfolio.reduce((sum, h) => sum + h.currentValue, 0);

            const allocation = portfolio.map((holding: EnrichedHolding) => ({
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
    getPortfolioHistory: async (userId: number, range = '1mo') => {
        try {
            const holdings = await portfolioModel.getHoldingsByUserId(userId);
            if (holdings.length === 0) return [];

            // Fetch historical data for all holdings in parallel
            const historicalDataMap: Record<string, any[]> = {};
            await Promise.all(
                holdings.map(async (holding: Holding) => {
                    try {
                        const history = await stockService.getHistoricalData(holding.symbol, range);
                        historicalDataMap[holding.symbol] = history || [];
                    } catch (err) {
                        historicalDataMap[holding.symbol] = [];
                    }
                })
            );

            // Build a set of all dates across all holdings
            const allDatesSet = new Set<string>();
            Object.values(historicalDataMap).forEach((history) => {
                history.forEach((point: any) => {
                    const dateKey = point.date.split('T')[0];
                    allDatesSet.add(dateKey);
                });
            });

            const sortedDates = Array.from(allDatesSet).sort();
            if (sortedDates.length === 0) return [];

            // Build price lookup maps: symbol -> { dateKey -> price }
            const priceMaps: Record<string, Record<string, number>> = {};
            for (const [symbol, history] of Object.entries(historicalDataMap)) {
                priceMaps[symbol] = {};
                history.forEach((point: any) => {
                    const dateKey = point.date.split('T')[0];
                    priceMaps[symbol][dateKey] = point.price;
                });
            }

            // Compute total portfolio value for each date
            const portfolioHistory: Array<{ date: string; value: number }> = [];
            const lastKnownPrice: Record<string, number> = {};

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
        } catch (error: any) {
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
    getPortfolioPerformance: async (userId: number, range = '1mo') => {
        try {
            const holdings = await portfolioModel.getHoldingsByUserId(userId);
            if (holdings.length === 0) return [];

            // Sort by current value (estimated), take top 5
            const priced = await Promise.all(
                holdings.map(async (h: Holding) => {
                    const price = await portfolioService.getCachedStockPrice(h.symbol);
                    return { ...h, currentValue: h.quantity * price };
                })
            );
            const top = priced.sort((a, b) => b.currentValue - a.currentValue).slice(0, 5);

            const results = await Promise.all(
                top.map(async (holding: Holding) => {
                    try {
                        const history = await stockService.getHistoricalData(holding.symbol, range);
                        if (!history || history.length === 0) return null;

                        const basePrice = history[0].price;
                        if (!basePrice || basePrice === 0) return null;

                        const data = history.map((point: any) => ({
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
    validateSymbol: async (symbol: string) => {
        try {
            const quote = await stockService.getStockQuote(symbol);
            return quote && quote.currentPrice !== undefined;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get portfolio breakdown by sector
     * @param {number} userId - User ID
     */
    getSectorBreakdown: async (userId: number) => {
        try {
            const portfolio = await portfolioService.getPortfolio(userId);
            if (portfolio.length === 0) return [];

            const sectors: Record<string, number> = {};
            let totalValue = 0;

            for (const holding of portfolio) {
                const quote = await stockService.getStockQuote(holding.symbol);
                const sector = quote.sector || 'Others';
                sectors[sector] = (sectors[sector] || 0) + holding.currentValue;
                totalValue += holding.currentValue;
            }

            const breakdown = Object.entries(sectors).map(([name, value]) => ({
                name,
                value: parseFloat(value.toFixed(2)),
                percentage: totalValue > 0 ? parseFloat(((value / totalValue) * 100).toFixed(2)) : 0
            }));

            return breakdown.sort((a, b) => b.value - a.value);
        } catch (error) {
            console.error('Error computing sector breakdown:', error.message);
            return [];
        }
    },

    /**
     * Calculate a health score for the portfolio (0-100)
     * Factors: Diversification (number of sectors), Profit/Loss, Number of assets
     */
    getHealthScore: async (userId: number) => {
        try {
            const summary = await portfolioService.getPortfolioSummary(userId);
            const sectors = await portfolioService.getSectorBreakdown(userId);
            
            if (summary.totalHoldings === 0) return 0;

            // 1. Diversification Score (max 40) - Based on number of sectors
            // 1 sector = 10, 2 = 25, 3+ = 40
            let divScore = Math.min(sectors.length * 15, 40);
            if (sectors.length === 1) divScore = 10;

            // 2. Performance Score (max 40) - Based on P/L %
            // > 0% = 20, > 5% = 30, > 10% = 40, < 0% = 10
            let perfScore = 20;
            if (summary.totalProfitLossPercent > 10) perfScore = 40;
            else if (summary.totalProfitLossPercent > 5) perfScore = 30;
            else if (summary.totalProfitLossPercent < 0) perfScore = 10;

            // 3. Asset Count Score (max 20)
            // 1 asset = 5, 2-4 = 15, 5+ = 20
            let assetScore = 5;
            if (summary.totalHoldings >= 5) assetScore = 20;
            else if (summary.totalHoldings >= 2) assetScore = 15;

            return divScore + perfScore + assetScore;
        } catch (error) {
            return 50; // Fallback
        }
    }
};

export = portfolioService;
