require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db/database');
const alertService = require('./services/alertService');

// Import routes
// Import routes
const watchlistRoutes = require('./routes/watchlist');
const stockRoutes = require('./routes/stock');
const alertRoutes = require('./routes/alerts');
const authRoutes = require('./routes/auth');
const alertEngine = require('./services/alertEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://stock-tracker-1-sj4n.onrender.com"
    ],
    credentials: true
}));

app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/alerts', alertRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Schedule alert engine to run every hour
// Schedule alert engine to run every hour
cron.schedule('0 * * * *', () => {
    console.log('Running scheduled user alert engine...');
    alertEngine.runAlertEngine();
});

// Also run on startup after 30 seconds
setTimeout(() => {
    console.log('Running initial alert engine check (User)...');
    alertEngine.runAlertEngine();
}, 30000);

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Stock Dashboard Backend Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`⏰ Alert engine scheduled to run every hour`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET    /api/health`);
    console.log(`  GET    /api/watchlist`);
    console.log(`  POST   /api/watchlist`);
    console.log(`  DELETE /api/watchlist/:id`);
    console.log(`  GET    /api/stock/:symbol`);
    console.log(`  GET    /api/stock/:symbol/history`);
    console.log(`  GET    /api/alerts`);
    console.log(`  POST   /api/alerts\n`);
});

module.exports = app;
