const alertModel = require('../models/alertModel');
const stockService = require('./stockService');
const logger = require('../utils/logger');

/**
 * Alert Rules Service
 * Evaluates alert rules against live stock data and fires alerts when conditions are met
 */

const TEMPLATE_LABELS = {
    PERCENTAGE_CHANGE: 'Price % Change',
    TARGET_PRICE: 'Target Price',
    VOLUME_SPIKE: 'Volume Spike'
};

const PRIORITY_EMOJI = {
    LOW: '🟢',
    MEDIUM: '🟡',
    HIGH: '🟠',
    CRITICAL: '🔴'
};

const alertRulesService = {
    /**
     * Evaluate a single rule against current stock data
     */
    evaluateRule: async (rule, quote) => {
        const { template_type, condition_operator, condition_value } = rule;
        let triggered = false;
        let message = '';

        try {
            if (template_type === 'PERCENTAGE_CHANGE') {
                const changePercent = quote.regularMarketChangePercent || 0;
                const absChange = Math.abs(changePercent);
                if (condition_operator === 'ABOVE' && changePercent >= condition_value) {
                    triggered = true;
                    message = `${rule.symbol} is UP ${changePercent.toFixed(2)}% (threshold: +${condition_value}%)`;
                } else if (condition_operator === 'BELOW' && changePercent <= -condition_value) {
                    triggered = true;
                    message = `${rule.symbol} is DOWN ${Math.abs(changePercent).toFixed(2)}% (threshold: -${condition_value}%)`;
                }

            } else if (template_type === 'TARGET_PRICE') {
                const price = quote.regularMarketPrice || 0;
                if (condition_operator === 'ABOVE' && price >= condition_value) {
                    triggered = true;
                    message = `${rule.symbol} hit $${price.toFixed(2)} (target: above $${condition_value})`;
                } else if (condition_operator === 'BELOW' && price <= condition_value) {
                    triggered = true;
                    message = `${rule.symbol} dropped to $${price.toFixed(2)} (target: below $${condition_value})`;
                }

            } else if (template_type === 'VOLUME_SPIKE') {
                const volume = quote.regularMarketVolume || 0;
                const avgVolume = quote.averageDailyVolume3Month || quote.averageDailyVolume10Day || 1;
                const spike = (volume / avgVolume) * 100;
                if (spike >= condition_value) {
                    triggered = true;
                    message = `${rule.symbol} volume spike: ${spike.toFixed(0)}% of average (threshold: ${condition_value}%)`;
                }
            }
        } catch (err) {
            logger.warn(`Rule evaluation error for rule ${rule.id}:`, { error: err.message });
        }

        return { triggered, message };
    },

    /**
     * Run all active rules for all users
     */
    runRulesEngine: async () => {
        try {
            const rules = await alertModel.getAllActiveRules();
            if (rules.length === 0) return;

            logger.info(`Running alert rules engine - evaluating ${rules.length} rules`);

            // Group rules by symbol for batch fetching
            const symbolMap = {};
            rules.forEach(rule => {
                if (!symbolMap[rule.symbol]) symbolMap[rule.symbol] = [];
                symbolMap[rule.symbol].push(rule);
            });

            // Fetch quotes and evaluate rules
            for (const [symbol, symbolRules] of Object.entries(symbolMap)) {
                try {
                    const quote = await stockService.getStockQuote(symbol);
                    if (!quote) continue;

                    for (const rule of symbolRules) {
                        const { triggered, message } = await alertRulesService.evaluateRule(rule, quote);
                        if (triggered) {
                            const emoji = PRIORITY_EMOJI[rule.priority] || '🔔';
                            await alertModel.createAlert(
                                rule.user_id,
                                symbol,
                                `${emoji} [${rule.priority}] ${message}`,
                                `RULE_${rule.template_type}`,
                                rule.priority,
                                `Rule #${rule.id}: ${TEMPLATE_LABELS[rule.template_type]}`
                            );
                            await alertModel.updateRuleLastTriggered(rule.id);
                            logger.info(`Alert rule triggered: ${message} for user ${rule.user_id}`);
                        }
                    }
                } catch (err) {
                    logger.warn(`Failed to evaluate rules for ${symbol}:`, { error: err.message });
                }
            }
        } catch (err) {
            logger.error('Alert rules engine error:', { error: err.message });
        }
    }
};

module.exports = alertRulesService;
