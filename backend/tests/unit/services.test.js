/**
 * Backend Unit Tests - Services
 * Tests for portfolioService calculations
 */

jest.mock('../../models/portfolioModel');
jest.mock('../../services/stockService');

const portfolioService = require('../../services/portfolioService');
const portfolioModel = require('../../models/portfolioModel');
const stockService = require('../../services/stockService');

describe('portfolioService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateHoldingMetrics', () => {
        it('should calculate correct P/L for profitable holding', () => {
            const holding = { symbol: 'AAPL', quantity: 10, buy_price: 150 };
            const result = portfolioService.calculateHoldingMetrics(holding, 180);
            expect(result.totalInvestment).toBe(1500);
            expect(result.currentValue).toBe(1800);
            expect(result.profitLoss).toBe(300);
            expect(result.profitLossPercent).toBe(20);
        });

        it('should calculate negative P/L for losing position', () => {
            const holding = { symbol: 'XYZ', quantity: 5, buy_price: 100 };
            const result = portfolioService.calculateHoldingMetrics(holding, 80);
            expect(result.profitLoss).toBe(-100);
            expect(result.profitLossPercent).toBe(-20);
        });

        it('should handle zero buy_price', () => {
            const holding = { symbol: 'TEST', quantity: 10, buy_price: 0 };
            const result = portfolioService.calculateHoldingMetrics(holding, 100);
            expect(result.profitLossPercent).toBe(0);
        });

        it('should preserve other holding properties', () => {
            const holding = { id: 42, symbol: 'MSFT', quantity: 3, buy_price: 300, buy_date: '2024-01-01' };
            const result = portfolioService.calculateHoldingMetrics(holding, 350);
            expect(result.id).toBe(42);
            expect(result.buy_date).toBe('2024-01-01');
        });
    });

    describe('getPortfolioSummary', () => {
        it('should return zeros for empty portfolio', async () => {
            portfolioModel.getHoldingsByUserId.mockResolvedValue([]);
            stockService.getStockQuote.mockResolvedValue({ regularMarketPrice: 100 });

            const summary = await portfolioService.getPortfolioSummary(1);
            expect(summary.totalHoldings).toBe(0);
            expect(summary.totalInvestment).toBe(0);
            expect(summary.totalProfitLoss).toBe(0);
        });

        it('should aggregate portfolio correctly', async () => {
            portfolioModel.getHoldingsByUserId.mockResolvedValue([
                { symbol: 'AAPL', quantity: 10, buy_price: 100 },
                { symbol: 'MSFT', quantity: 5, buy_price: 200 }
            ]);
            stockService.getStockQuote
                .mockResolvedValueOnce({ regularMarketPrice: 120 })
                .mockResolvedValueOnce({ regularMarketPrice: 250 });

            const summary = await portfolioService.getPortfolioSummary(1);
            expect(summary.totalHoldings).toBe(2);
            expect(summary.totalInvestment).toBe(2000); // 10*100 + 5*200
            expect(summary.totalCurrentValue).toBe(2450); // 10*120 + 5*250
            expect(summary.totalProfitLoss).toBe(450);
        });
    });

    describe('getPortfolioAllocation', () => {
        it('should compute allocation percentages', async () => {
            portfolioModel.getHoldingsByUserId.mockResolvedValue([
                { symbol: 'AAPL', quantity: 10, buy_price: 100 }
            ]);
            stockService.getStockQuote.mockResolvedValue({ regularMarketPrice: 100 });

            const allocation = await portfolioService.getPortfolioAllocation(1);
            expect(allocation[0].percentage).toBe(100);
            expect(allocation[0].symbol).toBe('AAPL');
        });
    });
});
