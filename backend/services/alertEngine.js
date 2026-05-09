const db = require('../db/database');
const stockService = require('./stockService');
const emailService = require('./emailService');
const aiService = require('./aiService');
const logger = require('../utils/logger');

const ALERT_COOLDOWN_HOURS = 24;

const runAlertEngine = async () => {
    logger.info('--- Starting Advanced Alert Engine ---');

    // 1. Get all active rules with user info
    const sql = `
        SELECT ar.*, u.email, u.plan, u.name 
        FROM alert_rules ar
        JOIN users u ON ar.user_id = u.id
        WHERE ar.is_active = 1
    `;

    db.all(sql, [], async (err, rules) => {
        if (err) {
            logger.error('Error fetching alert rules:', { error: err.message });
            return;
        }

        if (rules.length === 0) {
            logger.info('No active alert rules found.');
            return;
        }

        // 2. Group rules by symbol to minimize API calls
        const symbolGroups = rules.reduce((acc, rule) => {
            if (!acc[rule.symbol]) acc[rule.symbol] = [];
            acc[rule.symbol].push(rule);
            return acc;
        }, {});

        logger.info(`Processing ${rules.length} rules across ${Object.keys(symbolGroups).length} symbols.`);

        // 3. Process each symbol
        for (const symbol in symbolGroups) {
            try {
                const quote = await stockService.getStockQuote(symbol);
                const rulesForSymbol = symbolGroups[symbol];

                for (const rule of rulesForSymbol) {
                    await evaluateRule(rule, quote);
                }
            } catch (error) {
                logger.error(`Error processing symbol ${symbol}:`, { error: error.message });
            }
        }
    });
};

const evaluateRule = async (rule, quote) => {
    let triggered = false;
    let reason = '';

    // Check Cooldown
    if (rule.last_triggered_at) {
        const lastTrigger = new Date(rule.last_triggered_at);
        const hoursSince = (Date.now() - lastTrigger.getTime()) / (1000 * 60 * 60);
        if (hoursSince < ALERT_COOLDOWN_HOURS) {
            return; // Still in cooldown
        }
    }

    // Evaluate Condition
    switch (rule.template_type) {
        case 'TARGET_PRICE':
            if (rule.condition_operator === 'ABOVE' && quote.currentPrice >= rule.condition_value) {
                triggered = true;
                reason = `Price reached $${quote.currentPrice.toFixed(2)} (Target: >= $${rule.condition_value})`;
            } else if (rule.condition_operator === 'BELOW' && quote.currentPrice <= rule.condition_value) {
                triggered = true;
                reason = `Price dropped to $${quote.currentPrice.toFixed(2)} (Target: <= $${rule.condition_value})`;
            }
            break;

        case 'PERCENTAGE_CHANGE':
            const absChange = Math.abs(quote.changePercent);
            if (absChange >= rule.condition_value) {
                triggered = true;
                reason = `Price moved ${quote.changePercent.toFixed(2)}% (Threshold: ${rule.condition_value}%)`;
            }
            break;

        case 'VOLUME_SPIKE':
            // Placeholder: Volume analysis would require historical avg volume
            // For now, if we have volume in quote, we can do a simple check
            if (quote.volume && quote.avgVolume && quote.volume > quote.avgVolume * 2) {
                triggered = true;
                reason = `Unusual volume detected: ${quote.volume.toLocaleString()} shares`;
            }
            break;
    }

    if (triggered) {
        await triggerAlert(rule, quote, reason);
    }
};

const triggerAlert = async (rule, quote, reason) => {
    logger.info(`🔔 Alert Triggered: ${rule.email} | ${rule.symbol} | ${reason}`);

    try {
        // 1. Update rule last_triggered_at
        db.run('UPDATE alert_rules SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = ?', [rule.id]);

        // 2. Generate AI Explanation
        let aiExplanation = '';
        if (rule.plan === 'pro' || rule.plan === 'student') {
            try {
                aiExplanation = await aiService.explainAlert(
                    rule.symbol,
                    rule.template_type,
                    quote.currentPrice,
                    rule.condition_value,
                    quote.changePercent
                );
            } catch (e) {
                logger.warn('AI Explanation failed', { error: e.message });
            }
        }

        // 3. Save to History
        const historySql = `
            INSERT INTO user_alerts (user_id, symbol, message, reason, priority, alertType) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const message = `${rule.symbol} alert: ${reason}`;
        db.run(historySql, [
            rule.user_id, 
            rule.symbol, 
            message, 
            aiExplanation || reason, 
            rule.priority, 
            rule.template_type
        ]);

        // 4. Send Email
        await emailService.sendAlertEmail(rule.email, {
            symbol: quote.symbol,
            price: quote.currentPrice,
            change: quote.change,
            changePercent: quote.changePercent,
            aiExplanation: aiExplanation
        }, reason);

    } catch (error) {
        logger.error(`Error triggering alert for ${rule.id}:`, { error: error.message });
    }
};

module.exports = { runAlertEngine };

