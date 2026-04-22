const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

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
                open: quote.regularMarketOpen,
                dayHigh: quote.regularMarketDayHigh,
                dayLow: quote.regularMarketDayLow,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                volume: quote.regularMarketVolume,
                marketCap: quote.marketCap,
                trailingPE: quote.trailingPE,
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
                exchange: quote.fullExchangeName || quote.exchange,
                name: quote.longName || quote.shortName || symbol
            };
        } catch (error) {
            // Enhanced logging with stack for "fetch failed" issues
            if (error.message.includes('fetch failed')) {
                console.error(`NETWORK ERROR fetching ${symbol}:`, error);
            } else {
                console.error(`Error fetching ${symbol}:`, error.message);
            }

            if (error.message.includes('No data found') || error.message.includes('Not Found')) {
                const invalidError = new Error('Invalid stock symbol');
                invalidError.statusCode = 404;
                throw invalidError;
            }

            const networkError = new Error(`Failed to fetch stock data: ${error.message}`);
            networkError.statusCode = error.message.includes('fetch failed') ? 502 : 500;
            throw networkError;
        }
    },

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
                    interval = '5m';
                    break;
                case '5d':
                    startDate.setDate(startDate.getDate() - 5);
                    interval = '15m';
                    break;
                case '1mo':
                    startDate.setMonth(startDate.getMonth() - 1);
                    interval = '1d';
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    interval = '1d';
                    break;
                default:
                    startDate.setMonth(startDate.getMonth() - 1);
                    interval = '1d';
            }

            const queryOptions = {
                period1: startDate,
                period2: endDate,
                interval: interval
            };

            try {
                // Using chart() instead of deprecated historical()
                const result = await yahooFinance.chart(symbol.toUpperCase(), queryOptions);
                if (result && result.quotes && result.quotes.length > 0) {
                    return result.quotes.map(item => ({
                        date: new Date(item.date).toISOString(),
                        price: item.close
                    })).filter(item => item.price !== null);
                }
            } catch (err) {
                console.warn(`Failed to fetch chart data for ${symbol} (${range}, ${interval}): ${err.message}`);
            }

            return [];
        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error.message);
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
