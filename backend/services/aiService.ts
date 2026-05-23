import OpenAI from 'openai';
import db from '../db/database';

// Initialize OpenAI client only if key is present
const aiEnabled = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
const openai = aiEnabled ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * AI Service - Business Logic for AI interactions
 */
const aiService = {
    /**
     * AI Chat Advisor
     */
    chat: async (userId: number, userMessage: string, portfolioContext: unknown) => {
        if (!openai) {
            return "Quotra AI is currently in 'Limited Mode' because no OpenAI API key was found. Please add a valid key to your .env file to enable the full advisor experience.";
        }

        try {
            const history = await new Promise<any[]>((resolve, reject) => {
                db.all(
                    'SELECT role, content FROM ai_chats WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
                    [userId],
                    (err: Error | null, rows: any[]) => {
                        if (err) reject(err);
                        else resolve(rows.reverse());
                    }
                );
            });

            const messages = [
                {
                    role: 'system',
                    content: `You are Quotra AI, a friendly and knowledgeable stock market advisor. 
                    You help retail investors understand their portfolio, analyze market trends, and make informed decisions.
                    You are NOT a licensed financial advisor — always remind users to do their own research.
                    Keep responses concise, clear, and jargon-free. Use bullet points for lists.
                    
                    User's current portfolio context:
                    ${JSON.stringify(portfolioContext, null, 2)}
                    
                    Today's date: ${new Date().toDateString()}`
                },
                ...history,
                { role: 'user', content: userMessage }
            ];

            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4o-mini',
                messages,
                max_tokens: 800,
                temperature: 0.7
            });

            const reply = completion.choices[0].message.content || '';

            db.serialize(() => {
                db.run('INSERT INTO ai_chats (user_id, role, content) VALUES (?, ?, ?)', [userId, 'user', userMessage]);
                db.run('INSERT INTO ai_chats (user_id, role, content) VALUES (?, ?, ?)', [userId, 'assistant', reply]);
            });

            return reply;
        } catch (error: any) {
            console.error('AI Chat Error:', error);
            // Re-throw or return a structured error if preferred, but for now we return a string
            return `AI Service Error: ${error.message}. Please check your API key and balance.`;
        }
    },

    /**
     * Generate Portfolio Health Report
     */
    generatePortfolioReport: async (userId: number, enrichedHoldings: any[]) => {
        if (!openai) {
            return { 
                content: "<h3>AI Analysis Unavailable</h3><p>Please configure your OpenAI API key to generate detailed portfolio health reports.</p>", 
                summary: "AI analysis is currently disabled." 
            };
        }

        try {
            const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
            const totalPnL = enrichedHoldings.reduce((sum, h) => sum + h.profitLoss, 0);
            const topHolding = enrichedHoldings.sort((a, b) => b.currentValue - a.currentValue)[0];

            const prompt = `Generate a professional portfolio health report for a retail investor.
            
            Data:
            - Total Value: $${totalValue.toFixed(2)}
            - Total Profit/Loss: $${totalPnL.toFixed(2)}
            - Top Position: ${topHolding ? `${topHolding.symbol} (${((topHolding.currentValue / totalValue) * 100).toFixed(1)}% allocation)` : 'None'}
            
            Generate HTML content with these sections:
            1. Executive Summary
            2. Top Performers & Underperformers
            3. Risk & Diversification Analysis
            4. Suggested Actions`;

            const res = await openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000
            });

            const content = res.choices[0].message.content || '';
            const summary = content.replace(/<[^>]*>/g, '').slice(0, 200) + '...';

            db.run(
                'INSERT INTO ai_reports (user_id, report_type, content_html, summary) VALUES (?, ?, ?, ?)',
                [userId, 'health', content, summary]
            );

            return { content, summary };
        } catch (error: any) {
            console.error('AI Report Error:', error);
            throw error;
        }
    },

    /**
     * Explain triggered alert
     */
    explainAlert: async (symbol: string, alertType: string, targetValue: number, currentPrice: number, changePercent: number) => {
        if (!openai) return "No AI explanation available (API key missing).";

        try {
            const prompt = `Explain why a stock alert was triggered for ${symbol}.
            Alert Type: ${alertType}
            Current Price: $${currentPrice} (${changePercent}% today)
            Provide a 2-sentence explanation for a retail investor.`;
            
            const res = await openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150
            });

            return res.choices[0].message.content || '';
        } catch (error) {
            return "Unable to generate AI explanation at this time.";
        }
    }
};

export = aiService;
