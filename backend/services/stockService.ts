import YahooFinance from 'yahoo-finance2';

// Create a configured instance of YahooFinance
const yahooFinance = new YahooFinance();
// Set options directly via the global settings or use as a singleton
(yahooFinance as any).setGlobalConfig?.({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

interface StockQuoteData {
    symbol: string;
    currentPrice: number;
    previousClose: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    change: number;
    changePercent: number;
    volume: number;
    avgVolume: number;
    marketCap: number;
    trailingPE?: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    exchange: string;
    name: string;
    sector: string;
    industry: string;
}

interface HistoricalPricePoint {
    date: string;
    price: number;
}

// Basic in-memory cache
const quoteCache = new Map<string, { data: StockQuoteData; timestamp: number }>();
const historicalCache = new Map<string, { data: HistoricalPricePoint[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const HISTORICAL_TTL = 15 * 60 * 1000; // 15 minutes

const stockService = {
    // Get current stock quote from Yahoo Finance
    getStockQuote: async (symbol: string): Promise<StockQuoteData> => {
        const stockSymbol = symbol.toUpperCase();
        
        // 1. Check Cache
        if (quoteCache.has(stockSymbol)) {
            const cached = quoteCache.get(stockSymbol);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data;
            }
        }

        try {
            const quote = await yahooFinance.quote(stockSymbol);

            if (!quote) {
                const invalidError: any = new Error('Invalid stock symbol');
    invalidError.statusCode = 404;
    throw invalidError;
            }

            const data: StockQuoteData = {
                symbol: quote.symbol,
                currentPrice: quote.regularMarketPrice ?? 0,
                previousClose: quote.regularMarketPreviousClose ?? 0,
                open: quote.regularMarketOpen ?? 0,
                dayHigh: quote.regularMarketDayHigh ?? 0,
                dayLow: quote.regularMarketDayLow ?? 0,
                change: quote.regularMarketChange ?? 0,
                changePercent: quote.regularMarketChangePercent ?? 0,
                volume: quote.regularMarketVolume ?? 0,
                avgVolume: quote.averageDailyVolume3Month || quote.averageDailyVolume10Day || 0,
                marketCap: quote.marketCap ?? 0,
                trailingPE: quote.trailingPE,
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? 0,
                fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? 0,
                exchange: (quote.fullExchangeName || quote.exchange) ?? '',
                name: (quote.longName || quote.shortName) ?? stockSymbol,
                sector: (quote as any).sector || 'N/A',
                industry: (quote as any).industry || 'N/A'
            };

            // 2. Update Cache
            quoteCache.set(stockSymbol, { data, timestamp: Date.now() });

            return data;
        } catch (error: any) {
            // 3. Fallback to expired cache if available during network failure
            if (quoteCache.has(stockSymbol)) {
                console.warn(`⚠️ Fetch failed for ${stockSymbol}, serving stale cache: ${error.message}`);
                return quoteCache.get(stockSymbol)!.data;
            }

            // Enhanced logging for "fetch failed" issues (common with Yahoo Finance on cloud IPs)
            if (error.message?.includes('fetch failed') || error.message?.includes('403')) {
                console.error(`❌ YAHOO FINANCE BLOCK on ${stockSymbol}:`, error.message);
                const blockError: any = new Error('Market data currently unavailable from our provider. Please try again later.');
                blockError.statusCode = 503;
                throw blockError;
            }

            if (error.message?.includes('No data found') || error.message?.includes('Not Found')) {
                const invalidError: any = new Error('Invalid stock symbol');
                invalidError.statusCode = 404;
                throw invalidError;
            }

            const generalError: any = new Error(`Failed to fetch stock data: ${error.message}`);
            generalError.statusCode = 500;
            throw generalError;
        }
    },

    // Get historical data for charts
    getHistoricalData: async (symbol: string, range = '1mo'): Promise<HistoricalPricePoint[]> => {
        const stockSymbol = symbol.toUpperCase();
        const cacheKey = `${stockSymbol}_${range}`;

        // 1. Check Cache
        if (historicalCache.has(cacheKey)) {
            const cached = historicalCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < HISTORICAL_TTL) {
                return cached.data;
            }
        }

        try {
            const endDate = new Date();
            const startDate = new Date();
            let interval: any = '1d';

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
                const result = await yahooFinance.chart(stockSymbol, queryOptions);
                if (result && result.quotes && result.quotes.length > 0) {
                    const data: HistoricalPricePoint[] = result.quotes.map(item => ({
                        date: new Date(item.date).toISOString(),
                        price: item.close as number
                    })).filter(item => item.price !== null && item.price !== undefined);

                    // 2. Update Cache
                    historicalCache.set(cacheKey, { data, timestamp: Date.now() });

                    return data;
                }
            } catch (err: any) {
                console.warn(`⚠️ Failed to fetch chart data for ${stockSymbol} (${range}): ${err.message}`);
                // Fallback to stale cache if fetch fails
                if (historicalCache.has(cacheKey)) {
                    return historicalCache.get(cacheKey)!.data;
                }
            }

            return [];
        } catch (error: any) {
            console.error(`❌ Error fetching historical data for ${symbol}:`, error.message);
            return [];
        }
    },

    // Calculate Simple Moving Average
    calculateMovingAverage: (prices: number[], period = 20): number | null => {
        if (!prices || prices.length < period) {
            return null;
        }

        const recentPrices = prices.slice(-period);
        const sum = recentPrices.reduce((acc, val) => acc + val, 0);
        return sum / period;
    },

    // Calculate RSI (Relative Strength Index)
    calculateRSI: (prices: number[], period = 14): number | null => {
        if (!prices || prices.length <= period) return null;

        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period + 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            let currentGain = 0;
            let currentLoss = 0;

            if (diff >= 0) currentGain = diff;
            else currentLoss = -diff;

            avgGain = (avgGain * (period - 1) + currentGain) / period;
            avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
        }

        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    },

    // Get trending symbols and their current data
    getTrendingStocks: async (region = 'US'): Promise<StockQuoteData[]> => {
        try {
            // Fetch trending symbols for region
            const trending = await yahooFinance.trendingSymbols(region);
            if (!trending || !trending.quotes || trending.quotes.length === 0) {
                return [];
            }

            // Get full data for top 6 trending stocks
            const topSymbols = trending.quotes.slice(0, 6).map(q => q.symbol);
            const results = await Promise.allSettled(
                topSymbols.map(symbol => stockService.getStockQuote(symbol))
            );

            return results
                .filter((r): r is PromiseFulfilledResult<StockQuoteData> => r.status === 'fulfilled')
                .map(r => r.value);
        } catch (error: any) {
            console.error('❌ Error fetching trending stocks:', error.message);
            return [];
        }
    }
};

export = stockService;
