import stockService from './stockService';
import alertModelModule from '../models/alertModel';
import watchlistModelModule from '../models/watchlistModel';

const alertModel: any = alertModelModule;
const watchlistModel: any = watchlistModelModule;

const alertService = {
    // Check for price drop alert (>5% drop)
    checkPriceDropAlert: async (symbol: string, currentPrice: number, previousClose: number) => {
        const changePercent = ((currentPrice - previousClose) / previousClose) * 100;

        if (changePercent <= -5) {
            const message = `${symbol} dropped ${Math.abs(changePercent).toFixed(2)}% to $${currentPrice.toFixed(2)}`;
            await alertModel.createAlert(symbol, message, 'PRICE_DROP');
            console.log(`Alert created: ${message}`);
            return true;
        }

        return false;
    },

    // Check for moving average crossover
    checkMovingAverageCrossover: async (symbol: string, currentPrice: number, historicalPrices: any[]) => {
        if (historicalPrices.length < 20) {
            return false;
        }

        const prices = historicalPrices.map((item) => item.price);
        const ma20 = stockService.calculateMovingAverage(prices, 20);

        if (!ma20) {
            return false;
        }

        // Check if current price crossed above MA
        const previousPrice = prices[prices.length - 2];

        if (previousPrice < ma20 && currentPrice > ma20) {
            const message = `${symbol} crossed above 20-day MA ($${ma20.toFixed(2)}) at $${currentPrice.toFixed(2)}`;
            await alertModel.createAlert(symbol, message, 'MA_CROSSOVER_UP');
            console.log(`Alert created: ${message}`);
            return true;
        }

        // Check if current price crossed below MA
        if (previousPrice > ma20 && currentPrice < ma20) {
            const message = `${symbol} crossed below 20-day MA ($${ma20.toFixed(2)}) at $${currentPrice.toFixed(2)}`;
            await alertModel.createAlert(symbol, message, 'MA_CROSSOVER_DOWN');
            console.log(`Alert created: ${message}`);
            return true;
        }

        return false;
    },

    // Main alert engine - check all watchlist stocks
    runAlertEngine: async () => {
        try {
            console.log('Running alert engine...');
            const watchlist = await watchlistModel.getAllStocks();

            if (watchlist.length === 0) {
                console.log('No stocks in watchlist');
                return;
            }

            for (const stock of watchlist as any[]) {
                try {
                    const quote = await stockService.getStockQuote(stock.symbol);
                    const historicalData = await stockService.getHistoricalData(stock.symbol, '1mo');

                    // Check for price drop
                    await alertService.checkPriceDropAlert(
                        stock.symbol,
                        quote.currentPrice,
                        quote.previousClose
                    );

                    // Check for MA crossover
                    await alertService.checkMovingAverageCrossover(
                        stock.symbol,
                        quote.currentPrice,
                        historicalData
                    );

                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error: any) {
                    console.error(`Error checking ${stock.symbol}:`, error.message);
                }
            }

            console.log('Alert engine completed');
        } catch (error: any) {
            console.error('Alert engine error:', error.message);
        }
    }
};

export = alertService;
