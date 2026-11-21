/**
 * Unknown symbols must surface as 404. When Yahoo blocks its quote endpoint (as it does
 * from Render), quotes are built from chart data; only when that fails too is it a 503.
 */
const mockQuote = jest.fn();
const mockChart = jest.fn();

jest.mock('yahoo-finance2', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ quote: mockQuote, chart: mockChart }))
}));

const CRUMB_429 = new Error('Failed to get crumb, status 429, statusText: Too Many Requests');

// Daily bars in New York time (gmtoffset -5h); regular session opens 14:30 UTC
const chartResult = {
    meta: {
        symbol: 'AAPL',
        regularMarketPrice: 344.63,
        regularMarketTime: new Date('2026-10-30T20:00:01Z'),
        gmtoffset: -18000,
        regularMarketDayHigh: 349.19,
        regularMarketDayLow: 342.35,
        regularMarketVolume: 67841555,
        fiftyTwoWeekHigh: 351.73,
        fiftyTwoWeekLow: 243.42,
        fullExchangeName: 'NasdaqGS',
        longName: 'Apple Inc.'
    },
    quotes: [
        { date: new Date('2026-10-28T13:30:00Z'), open: 340, close: 345.5, volume: 30000000 },
        { date: new Date('2026-10-29T13:30:00Z'), open: 348, close: 348.91, volume: 40000000 },
        { date: new Date('2026-10-30T13:30:00Z'), open: 346.72, close: 344.63, volume: 50000000 }
    ]
};

// Fresh module per test so the "quote endpoint blocked" state doesn't leak between tests
const loadServices = () => {
    let services: any;
    jest.isolateModules(() => {
        services = {
            stockService: require('../../services/stockService'),
            portfolioService: require('../../services/portfolioService')
        };
    });
    return services;
};

describe('stock quote sources and error classification', () => {
    beforeEach(() => {
        mockQuote.mockReset();
        mockChart.mockReset();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('reports an unknown symbol as 404 without trying the chart', async () => {
        const { stockService } = loadServices();
        mockQuote.mockResolvedValue(undefined);

        await expect(stockService.getStockQuote('ZZZZZQ')).rejects.toMatchObject({
            statusCode: 404,
            message: 'Invalid stock symbol'
        });
        expect(mockChart).not.toHaveBeenCalled();
    });

    it('builds the quote from chart data when the quote endpoint is rate-limited', async () => {
        const { stockService } = loadServices();
        mockQuote.mockRejectedValue(CRUMB_429);
        mockChart.mockResolvedValue(chartResult);

        const quote = await stockService.getStockQuote('aapl');

        expect(quote).toMatchObject({
            symbol: 'AAPL',
            currentPrice: 344.63,
            previousClose: 348.91,
            open: 346.72,
            dayHigh: 349.19,
            dayLow: 342.35,
            volume: 67841555,
            avgVolume: 40000000,
            marketCap: 0,
            fiftyTwoWeekHigh: 351.73,
            exchange: 'NasdaqGS',
            name: 'Apple Inc.'
        });
        expect(quote.change).toBeCloseTo(-4.28, 6);
        expect(quote.changePercent).toBeCloseTo(-1.226677, 5);
    });

    it('uses the latest bar as the previous close when today\'s session has no bar yet', async () => {
        const { stockService } = loadServices();
        mockQuote.mockRejectedValue(CRUMB_429);
        mockChart.mockResolvedValue({
            ...chartResult,
            meta: { ...chartResult.meta, regularMarketPrice: 350, regularMarketTime: new Date('2026-11-02T15:00:00Z') }
        });

        const quote = await stockService.getStockQuote('AAPL');

        expect(quote.previousClose).toBe(344.63);
        expect(quote.open).toBe(0);
        expect(quote.change).toBeCloseTo(5.37, 6);
    });

    it('skips the blocked quote endpoint on later lookups', async () => {
        const { stockService } = loadServices();
        mockQuote.mockRejectedValue(CRUMB_429);
        mockChart.mockResolvedValue(chartResult);

        await stockService.getStockQuote('AAPL');
        await stockService.getStockQuote('MSFT');

        expect(mockQuote).toHaveBeenCalledTimes(1);
        expect(mockChart).toHaveBeenCalledTimes(2);
    });

    it('reports a 503 when both Yahoo endpoints are blocked', async () => {
        const { stockService } = loadServices();
        mockQuote.mockRejectedValue(CRUMB_429);
        mockChart.mockRejectedValue(new Error('fetch failed'));

        await expect(stockService.getStockQuote('AAPL')).rejects.toMatchObject({ statusCode: 503 });
    });

    it('reports an unknown symbol as 404 on the chart fallback', async () => {
        const { stockService } = loadServices();
        mockQuote.mockRejectedValue(CRUMB_429);
        mockChart.mockRejectedValue(new Error('No data found, symbol may be delisted'));

        await expect(stockService.getStockQuote('ZZZZZQ')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('validateSymbol returns false only for unknown symbols', async () => {
        const { portfolioService } = loadServices();
        mockQuote.mockResolvedValue(undefined);

        await expect(portfolioService.validateSymbol('ZZZZZQ')).resolves.toBe(false);
    });

    it('validateSymbol accepts symbols priced from chart data', async () => {
        const { portfolioService } = loadServices();
        mockQuote.mockRejectedValue(CRUMB_429);
        mockChart.mockResolvedValue(chartResult);

        await expect(portfolioService.validateSymbol('AAPL')).resolves.toBe(true);
    });

    it('validateSymbol rethrows when market data is unavailable', async () => {
        const { portfolioService } = loadServices();
        mockQuote.mockRejectedValue(CRUMB_429);
        mockChart.mockRejectedValue(new Error('fetch failed'));

        await expect(portfolioService.validateSymbol('AAPL')).rejects.toMatchObject({ statusCode: 503 });
    });
});
