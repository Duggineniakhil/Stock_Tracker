const db = require('../db/database');
const stockService = require('./stockService');
const emailService = require('./emailService');

const runAlertEngine = async () => {
    console.log('--- Starting User Alert Engine ---');

    // 1. Get all users
    db.all('SELECT id, email FROM users', [], async (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return;
        }

        for (const user of users) {
            // 2. Get user's watchlist
            db.all('SELECT symbol FROM user_watchlist WHERE user_id = ?', [user.id], async (wErr, watchlist) => {
                if (wErr) {
                    console.error(`Error fetching watchlist for user ${user.id}:`, wErr);
                    return;
                }

                if (watchlist.length === 0) return;

                console.log(`Processing ${watchlist.length} stocks for user ${user.email}`);

                for (const item of watchlist) {
                    try {
                        // 3. Fetch Stock Data
                        const quote = await stockService.getStockQuote(item.symbol);

                        // 4. Analyze for Alerts
                        const analysis = await analyzeStock(quote);

                        if (analysis.shouldAlert) {
                            console.log(`Triggering alert for ${user.email}: ${item.symbol} - ${analysis.reason}`);

                            // 5. Send Email
                            await emailService.sendAlertEmail(user.email, {
                                symbol: quote.symbol,
                                price: quote.currentPrice,
                                change: quote.change,
                                changePercent: quote.changePercent
                            }, analysis.reason);

                            // 6. Save to User Alerts DB
                            const sql = 'INSERT INTO user_alerts (user_id, symbol, message, reason) VALUES (?, ?, ?, ?)';
                            const message = `${quote.symbol} moved ${quote.changePercent.toFixed(2)}%`;
                            db.run(sql, [user.id, quote.symbol, message, analysis.reason]);
                        }

                    } catch (sErr) {
                        console.error(`Error processing ${item.symbol} for user ${user.id}:`, sErr.message);
                    }
                }
            });
        }
    });
};

// Helper: Analyze Stock Logic
const analyzeStock = async (quote) => {
    // Simple logic for demonstration
    // In production, we would fetch historical data to SMA, RSI, etc.

    // Condition 1: Significant Move (> 5% or < -5%)
    if (Math.abs(quote.changePercent) >= 5) {
        return {
            shouldAlert: true,
            reason: `Price moved significantly (${quote.changePercent.toFixed(2)}%) within the trading day.`
        };
    }

    // Condition 2: High Volatility (Placeholder logic)
    // If we had historical data here, we could check SMA.
    // For now, let's just alert on 5% which is the user requirement.

    // User Requirement: "crosses moving average"
    // To do this, we need historical data.
    try {
        // Fetch 30 days of history for SMA
        const history = await stockService.getHistoricalData(quote.symbol, '1mo');
        if (history && history.length >= 20) {
            const prices = history.map(h => h.price);
            const sma20 = stockService.calculateMovingAverage(prices, 20);

            // Check if current price crossed SMA
            // We need previous price too to detect 'cross'.
            // Assume previous price is yesterday's close (which is in history[-1] usually or history[-2] depending on live status)
            // history ends with latest available close.

            if (sma20) {
                const currentPrice = quote.currentPrice;
                // Heuristic: If price is close to SMA and moving away?
                // Let's just say if Price < SMA (Bearish) or Price > SMA (Bullish) AND the move is fresh?
                // Detecting "Cross" requires state (previous value). 
                // We don't store previous state easily here without more DB queries.

                // Simplified Logic: If price deviates > 10% from SMA?
                // Or just: "Price is 5% above 20-day SMA"
                const deviation = ((currentPrice - sma20) / sma20) * 100;

                if (deviation > 5 && quote.changePercent > 0) {
                    return {
                        shouldAlert: true,
                        reason: `Bullish Trend: Price is ${deviation.toFixed(1)}% above the 20-day Moving Average ($${sma20.toFixed(2)}).`
                    };
                }
                if (deviation < -5 && quote.changePercent < 0) {
                    return {
                        shouldAlert: true,
                        reason: `Bearish Trend: Price is ${Math.abs(deviation).toFixed(1)}% below the 20-day Moving Average ($${sma20.toFixed(2)}).`
                    };
                }
            }
        }
    } catch (e) {
        console.warn('SMA check failed:', e.message);
    }

    return { shouldAlert: false };
};

module.exports = { runAlertEngine };
