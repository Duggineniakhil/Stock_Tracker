import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from './config';
import db from './db/database';
import logger from './utils/logger';
import requestLogger from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter, stockLimiter } from './middleware/rateLimiter';
import sanitize from './middleware/sanitize';
import swaggerSetup from './swagger';

// Import routes
const watchlistRoutes = require('./routes/watchlist');
const stockRoutes = require('./routes/stock');
const alertRoutes = require('./routes/alerts');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = config.PORT;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/+$/, '');
        if (!config.CORS_ORIGINS.includes(normalizedOrigin)) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    crossOriginEmbedderPolicy: false, // Allow Swagger UI
    crossOriginOpenerPolicy: false    // Allow Google Auth popups
}));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());
app.use(cookieParser());

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Input Sanitization ────────────────────────────────────────────────────────
app.use(sanitize);

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
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);

// ── Legacy Routes (backward compatibility) ────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioRoutes);

// ── 404 & Error Handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// Alert engine is now managed by a separate worker process.

// ── Start Server ──────────────────────────────────────────────────────────────
if (config.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`🚀 Stock Tracker Backend running on port ${config.PORT}`);
        logger.info(`📚 API Docs: http://localhost:${config.PORT}/api/v1/docs`);
        logger.info(`🏥 Health:   http://localhost:${config.PORT}/api/v1/health`);
    });
}

export = app;
