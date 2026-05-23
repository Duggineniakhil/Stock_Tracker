import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import aiService from '../services/aiService';
import sentimentService from '../services/sentimentService';
import portfolioService from '../services/portfolioService';
import stockService from '../services/stockService';
import db from '../db/database';

/**
 * AI Controller - Handles API requests for AI features
 */
const aiController = {
    /**
     * POST /api/v1/ai/chat
     * Interaction with Quotra AI advisor
     */
    chat: async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { message } = req.body;
            const userId = req.user?.id;

            if (!message) {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }

            // Get portfolio context to personalize the AI response
            const portfolio = await portfolioService.getPortfolioSummary(userId);
            const holdings = await portfolioService.getPortfolio(userId);

            const context = {
                summary: portfolio,
                holdings: holdings.map((h: any) => ({ symbol: h.symbol, quantity: h.quantity, pnl: h.profitLossPercent }))
            };

            const reply = await aiService.chat(userId, message, context);

            res.json({
                success: true,
                reply
            });
        } catch (error: any) {
            console.error('AI Chat Controller Error:', error);
            res.status(500).json({ success: false, message: 'AI advisor is currently unavailable' });
        }
    },

    /**
     * GET /api/v1/ai/chat/history
     */
    getChatHistory: async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            db.all(
                'SELECT role, content, created_at FROM ai_chats WHERE user_id = ? ORDER BY created_at ASC LIMIT 50',
                [userId],
                (err: Error | null, rows: any[]) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    res.json({ success: true, history: rows });
                }
            );
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * GET /api/v1/ai/sentiment/:symbol
     */
    getSentiment: async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { symbol } = req.params;
            
            // Note: In a real app, you'd fetch actual news here. 
            // For now, we'll simulate or use stock metadata if available.
            // Yahoo Finance package doesn't have a direct "news" endpoint in basic usage, 
            // but we can pass recent price action descriptions or placeholder headlines.
            const quote = await stockService.getStockQuote(symbol);
            
            // Simulation of headlines for demonstration
            const mockHeadlines = [
                `${symbol} shares trading ${quote.changePercent > 0 ? 'higher' : 'lower'} following quarterly results`,
                `Analysts maintain rating on ${symbol} amid market volatility`,
                `${symbol} expansion plans announced for upcoming fiscal year`,
                `Institutional investors increase stake in ${symbol}`
            ];

            const results = await sentimentService.analyzeSentiment(symbol, mockHeadlines);
            const overall = sentimentService.getOverallSentiment(results);

            res.json({
                success: true,
                symbol: symbol.toUpperCase(),
                overall,
                details: results
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/report/generate
     */
    generateReport: async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const portfolio = await portfolioService.getPortfolio(userId);

            if (!portfolio || portfolio.length === 0) {
                return res.status(400).json({ success: false, message: 'No holdings found to generate report' });
            }

            const report = await aiService.generatePortfolioReport(userId, portfolio);

            res.json({
                success: true,
                report
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * GET /api/v1/ai/report/latest
     */
    getLatestReport: (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.id;
        db.get(
            'SELECT * FROM ai_reports WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1',
            [userId],
            (err: Error | null, row: any) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                if (!row) return res.status(404).json({ success: false, message: 'No reports found' });
                res.json({ success: true, report: row });
            }
        );
    }
};

export = aiController;
