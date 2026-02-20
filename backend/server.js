require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');

const db = require('./db/database');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, stockLimiter } = require('./middleware/rateLimiter');
const swaggerSetup = require('./swagger');

// Import routes
const watchlistRoutes = require('./routes/watchlist');
const stockRoutes = require('./routes/stock');
const alertRoutes = require('./routes/alerts');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const alertEngine = require('./services/alertEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // needed for Swagger UI
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:']
        }
    },
    crossOriginEmbedderPolicy: false // Allow Swagger UI
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://stock-tracker-1-sj4n.onrender.com"
    ],
    credentials: true
}));
app.options("*", cors());

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request Logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── API Docs (Swagger) ─────────────────────────────────────────────────────────
swaggerSetup(app);

// ── Health Check (no rate limit, no auth) ────────────────────────────────────
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'OK',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Legacy health check (backward compat)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/stock', stockLimiter);
app.use('/api/v1', apiLimiter);

// ── v1 Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);

// ── Legacy Routes (backward compatibility) ────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioRoutes);

// ── 404 & Error Handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Scheduled Alert Engine ────────────────────────────────────────────────────
cron.schedule('0 * * * *', () => {
    logger.info('Running scheduled alert engine...');
    alertEngine.runAlertEngine().catch(err => logger.error('Alert engine error', { error: err.message }));
});

setTimeout(() => {
    logger.info('Running initial alert engine check...');
    alertEngine.runAlertEngine().catch(err => logger.error('Alert engine startup error', { error: err.message }));
}, 30000);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`🚀 Stock Tracker Backend running on port ${PORT}`);
    logger.info(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
    logger.info(`🏥 Health:   http://localhost:${PORT}/api/v1/health`);
});

module.exports = app;
