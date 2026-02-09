const stockService = require('./stockService');
const alertModel = require('../models/alertModel');
const watchlistModel = require('../models/watchlistModel');

const alertService = {
    // Check for price drop alert (>5% drop)
    checkPriceDropAlert: async (symbol, currentPrice, previousClose) => {
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
    checkMovingAverageCrossover: async (symbol, currentPrice, historicalPrices) => {
        if (historicalPrices.length < 20) {
            return false;
        }

        const prices = historicalPrices.map(item => item.price);
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

            for (const stock of watchlist) {
                try {
                    const quote = await stockService.getStockQuote(stock.symbol);
                    const historicalData = await stockService.getHistoricalData(stock.symbol, 30);

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
                } catch (error) {
                    console.error(`Error checking ${stock.symbol}:`, error.message);
                }
            }

            console.log('Alert engine completed');
        } catch (error) {
            console.error('Alert engine error:', error.message);
        }
    }
};

module.exports = alertService;
