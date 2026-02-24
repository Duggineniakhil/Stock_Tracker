const portfolioModel = require('../models/portfolioModel');
const portfolioService = require('./portfolioService');
const logger = require('../utils/logger');

/**
 * Export Service
 * Handles exporting portfolio data in CSV format
 */

const exportService = {
    /**
     * Generate CSV content from portfolio data
     * @param {number} userId - User ID
     * @returns {Promise<string>} CSV content string
     */
    generatePortfolioCSV: async (userId) => {
        try {
            const portfolio = await portfolioService.getPortfolio(userId);

            if (portfolio.length === 0) {
                return 'Symbol,Quantity,Buy Price,Current Price,Total Investment,Current Value,Profit/Loss,Profit/Loss %\nNo holdings found';
            }

            const headers = [
                'Symbol',
                'Quantity',
                'Buy Price',
                'Buy Date',
                'Current Price',
                'Total Investment',
                'Current Value',
                'Profit/Loss',
                'Profit/Loss %'
            ];

            const rows = portfolio.map(h => [
                h.symbol,
                h.quantity,
                h.buy_price,
                h.buy_date || 'N/A',
                h.currentPrice,
                h.totalInvestment,
                h.currentValue,
                h.profitLoss,
                `${h.profitLossPercent}%`
            ]);

            // Add summary row
            const summary = await portfolioService.getPortfolioSummary(userId);
            rows.push([]);  // empty row
            rows.push(['TOTAL', summary.totalHoldings, '', '', '', summary.totalInvestment, summary.totalCurrentValue, summary.totalProfitLoss, `${summary.totalProfitLossPercent}%`]);

            const csv = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            return csv;
        } catch (error) {
            logger.error('CSV export failed', { error: error.message, userId });
            throw error;
        }
    }
};

module.exports = exportService;
