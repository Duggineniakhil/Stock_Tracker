const yahooFinance = require('yahoo-finance2').default;

const stockService = {
    // Get current stock quote from Yahoo Finance
    getStockQuote: async (symbol) => {
        try {
            const quote = await yahooFinance.quote(symbol.toUpperCase());

            if (!quote) {
                throw new Error('Stock symbol not found');
            }

            return {
                symbol: quote.symbol,
                currentPrice: quote.regularMarketPrice,
                previousClose: quote.regularMarketPreviousClose,
                dayHigh: quote.regularMarketDayHigh,
                dayLow: quote.regularMarketDayLow,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                volume: quote.regularMarketVolume,
                marketCap: quote.marketCap,
                name: quote.longName || quote.shortName || symbol
            };
        } catch (error) {
            console.error(`Error fetching ${symbol}:`, error.message);
            if (error.message.includes('No data found') || error.message.includes('Not Found')) {
                throw new Error('Invalid stock symbol');
            }
            throw new Error(`Failed to fetch stock data: ${error.message}`);
        }
    },

    // Get historical data for charts
    // Get historical data for charts
    getHistoricalData: async (symbol, range = '1mo') => {
        try {
            const endDate = new Date();
            let startDate = new Date();
            let interval = '1d';

            // Map range to start date and interval
            switch (range) {
                case '1d':
                    startDate.setDate(startDate.getDate() - 1);
                    interval = '5m'; // 5 minute interval for 1 day
                    break;
                case '5d':
                    startDate.setDate(startDate.getDate() - 5);
                    interval = '15m'; // 15 minute interval for 5 days
                    break;
                case '1mo':
                    startDate.setMonth(startDate.getMonth() - 1);
                    interval = '1d';
                    break;
                case 'ytd':
                    startDate = new Date(new Date().getFullYear(), 0, 1);
                    interval = '1d';
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    interval = '1d';
                    break;
                case 'max':
                    startDate = new Date(2000, 0, 1); // Approx max
                    interval = '1mo';
                    break;
                default:
                    // Default to 1 month if unknown
                    startDate.setMonth(startDate.getMonth() - 1);
                    interval = '1d';
            }

            // If passing 'days' number for backward compatibility
            if (typeof range === 'number') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - range);
                interval = '1d';
            }

            const queryOptions = {
                period1: startDate,
                period2: endDate,
                interval: interval
            };

            try {
                const result = await yahooFinance.historical(symbol.toUpperCase(), queryOptions);
                if (result && result.length > 0) {
                    return result.map(item => ({
                        date: item.date.toISOString(),
                        price: item.close
                    })).filter(item => item.price !== null);
                }
            } catch (err) {
                console.warn(`Failed to fetch granular data for ${symbol} (${range}, ${interval}): ${err.message}`);
            }

            // Fallback: If granular data fails or returns empty, try simpler interval (1d/1h)
            // This ensures the chart always shows *something*
            if (interval !== '1d') {
                console.log(`Attempting fallback for ${symbol} with 1d interval`);
                queryOptions.interval = '1d';
                // Reset start date for 1d fallbacks if needed, but keeping range is usually fine
                try {
                    const fallbackResult = await yahooFinance.historical(symbol.toUpperCase(), queryOptions);
                    if (fallbackResult && fallbackResult.length > 0) {
                        return fallbackResult.map(item => ({ date: item.date.toISOString(), price: item.close })).filter(item => item.price !== null);
                    }
                } catch (fallbackErr) {
                    console.error(`Fallback failed for ${symbol}: ${fallbackErr.message}`);
                }
            }

            throw new Error('No historical data available');
        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error.message);
            // Return empty array instead of throwing to prevent UI crash
            return [];
        }
    },

    // Calculate Simple Moving Average
    calculateMovingAverage: (prices, period = 20) => {
        if (prices.length < period) {
            return null;
        }

        const recentPrices = prices.slice(-period);
        const sum = recentPrices.reduce((acc, val) => acc + val, 0);
        return sum / period;
    }
};

module.exports = stockService;
