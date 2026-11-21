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

// Yahoo's quote endpoint needs a session "crumb", and Yahoo rate-limits fetching it from
// cloud IPs (e.g. Render). Its chart endpoint needs no crumb, so when quotes are blocked we
// build them from chart data instead, and skip the quote endpoint for a while.
const QUOTE_BLOCK_COOLDOWN = 15 * 60 * 1000; // 15 minutes
let quoteEndpointBlockedUntil = 0;

const isProviderBlock = (message = '') => /fetch failed|403|429|too many requests|crumb/i.test(message);

const invalidSymbolError = () => {
    const invalidError: any = new Error('Invalid stock symbol');
    invalidError.statusCode = 404;
    return invalidError;
};

const quoteFromQuoteEndpoint = async (stockSymbol: string): Promise<StockQuoteData> => {
    const quote = await yahooFinance.quote(stockSymbol);
    if (!quote) throw invalidSymbolError();

    return {
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
};

// Builds a quote from 3 months of daily bars. Market cap and P/E aren't in chart data.
const quoteFromChart = async (stockSymbol: string): Promise<StockQuoteData> => {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 3);
    const result: any = await yahooFinance.chart(stockSymbol, { period1, interval: '1d' });
    const meta = result?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') throw invalidSymbolError();

    const bars = (result.quotes || []).filter((bar: any) => typeof bar.close === 'number');
    const price: number = meta.regularMarketPrice;

    // Compare trading days in the exchange's timezone; the latest bar may be the current
    // session (then the previous close is the bar before it) or the last completed one.
    const exchangeDay = (date: Date | string | number) =>
        new Date(new Date(date).getTime() + (meta.gmtoffset || 0) * 1000).toISOString().slice(0, 10);
    const last = bars[bars.length - 1];
    const lastIsCurrentSession = Boolean(last && meta.regularMarketTime)
        && exchangeDay(last.date) === exchangeDay(meta.regularMarketTime);
    const previousBar = lastIsCurrentSession ? bars[bars.length - 2] : last;
    const previousClose: number = previousBar?.close ?? price;
    const change = price - previousClose;

    const volumes: number[] = bars.map((bar: any) => bar.volume).filter((v: any) => typeof v === 'number' && v > 0);
    const avgVolume = volumes.length ? Math.round(volumes.reduce((sum, v) => sum + v, 0) / volumes.length) : 0;

    return {
        symbol: meta.symbol || stockSymbol,
        currentPrice: price,
        previousClose,
        open: lastIsCurrentSession ? last.open ?? 0 : 0,
        dayHigh: meta.regularMarketDayHigh ?? 0,
        dayLow: meta.regularMarketDayLow ?? 0,
        change,
        changePercent: previousClose ? (change / previousClose) * 100 : 0,
        volume: meta.regularMarketVolume ?? 0,
        avgVolume,
        marketCap: 0,
        trailingPE: undefined,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
        exchange: (meta.fullExchangeName || meta.exchangeName) ?? '',
        name: (meta.longName || meta.shortName) ?? stockSymbol,
        sector: 'N/A',
        industry: 'N/A'
    };
};

const fetchQuote = async (stockSymbol: string): Promise<StockQuoteData> => {
    if (Date.now() < quoteEndpointBlockedUntil) {
        return quoteFromChart(stockSymbol);
    }

    try {
        return await quoteFromQuoteEndpoint(stockSymbol);
    } catch (error: any) {
        if (error.statusCode === 404 || !isProviderBlock(error.message)) throw error;

        console.warn(`⚠️ Yahoo quote endpoint blocked (${error.message}); using chart data for quotes`);
        quoteEndpointBlockedUntil = Date.now() + QUOTE_BLOCK_COOLDOWN;
        return quoteFromChart(stockSymbol);
    }
};

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
            const data = await fetchQuote(stockSymbol);

            // 2. Update Cache
            quoteCache.set(stockSymbol, { data, timestamp: Date.now() });

            return data;
        } catch (error: any) {
            // Unknown symbol (Yahoo returned no quote) - not a provider failure
            if (error.statusCode === 404) throw error;

            // 3. Fallback to expired cache if available during network failure
            if (quoteCache.has(stockSymbol)) {
                console.warn(`⚠️ Fetch failed for ${stockSymbol}, serving stale cache: ${error.message}`);
                return quoteCache.get(stockSymbol)!.data;
            }

            // Both Yahoo endpoints blocked or rate-limited
            if (isProviderBlock(error.message)) {
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
            switch (String(range).toLowerCase()) {
                case '1d':
                    startDate.setDate(startDate.getDate() - 1);
                    interval = '5m';
                    break;
                case '5d':
                case '1w':
                    startDate.setDate(startDate.getDate() - 7);
                    interval = '15m';
                    break;
                case '1mo':
                    startDate.setMonth(startDate.getMonth() - 1);
                    interval = '1d';
                    break;
                case '6mo':
                    startDate.setMonth(startDate.getMonth() - 6);
                    interval = '1d';
                    break;
                case 'ytd':
                    startDate.setMonth(0, 1);
                    startDate.setHours(0, 0, 0, 0);
                    interval = '1d';
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    interval = '1d';
                    break;
                case '5y':
                case 'max':
                    startDate.setFullYear(startDate.getFullYear() - 5);
                    interval = '1wk';
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
