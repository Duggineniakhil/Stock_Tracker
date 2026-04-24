const OpenAI = require('openai');
const db = require('../db/database');

const aiEnabled = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
const openai = aiEnabled ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * Sentiment Service - News analysis
 */
const sentimentService = {
    /**
     * Analyze Sentiment for a stock based on news headlines
     */
    analyzeSentiment: async (symbol, headlines) => {
        try {
            // 1. Check cache (2 hour TTL)
            const cached = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM news_sentiment 
                     WHERE symbol = ? AND cached_at > datetime('now', '-2 hours')`,
                    [symbol.toUpperCase()],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            if (cached && cached.length > 0) {
                return cached.map(r => ({
                    headline: r.headline,
                    sentiment: r.sentiment,
                    score: r.score
                }));
            }

            if (!openai || !headlines || headlines.length === 0) {
                return [];
            }

            // 2. No cache, call OpenAI
            const prompt = `Analyze market sentiment for ${symbol} based on these news headlines:
            ${headlines.join('\n')}
            
            Return a JSON object with a 'results' array. Each item should have:
            - headline: (string)
            - sentiment: (bullish, bearish, or neutral)
            - score: (float 0 to 1, where 1 is extremely bullish, 0 is extremely bearish)`;

            const res = await openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            });

            const content = JSON.parse(res.choices[0].message.content);
            const results = content.results || content.sentiments || Object.values(content)[0];

            if (!Array.isArray(results)) return [];

            // 3. Cache results
            db.serialize(() => {
                const stmt = db.prepare(`
                    INSERT INTO news_sentiment (symbol, headline, sentiment, score) 
                    VALUES (?, ?, ?, ?)
                `);
                results.forEach(r => {
                    stmt.run(symbol.toUpperCase(), r.headline, r.sentiment, r.score);
                });
                stmt.finalize();
            });

            return results;
        } catch (error) {
            console.error('Sentiment Analysis Error:', error);
            return [];
        }
    },

    /**
     * Get aggregate sentiment label
     */
    getOverallSentiment: (results) => {
        if (!results || results.length === 0) return { label: 'neutral', score: 0.5 };

        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        let label = 'neutral';
        if (avgScore > 0.6) label = 'bullish';
        else if (avgScore < 0.4) label = 'bearish';

        return { label, score: parseFloat(avgScore.toFixed(2)) };
    }
};

module.exports = sentimentService;
