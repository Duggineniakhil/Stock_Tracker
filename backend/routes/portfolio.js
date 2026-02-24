const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { validate } = require('../middleware/validation/portfolioValidation');
const authMiddleware = require('../middleware/auth');
const exportService = require('../services/exportService');

/**
 * Portfolio Routes
 * All routes are protected and require authentication
 */

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   POST /api/portfolio
 * @desc    Add a new holding to portfolio
 * @access  Private
 */
router.post('/', validate('addHolding'), portfolioController.addHolding);

/**
 * @route   GET /api/portfolio
 * @desc    Get user's complete portfolio with calculations
 * @access  Private
 */
router.get('/', portfolioController.getPortfolio);

/**
 * @route   GET /api/portfolio/summary
 * @desc    Get aggregated portfolio metrics
 * @access  Private
 */
router.get('/summary', portfolioController.getSummary);

/**
 * @route   GET /api/portfolio/allocation
 * @desc    Get portfolio allocation breakdown
 * @access  Private
 */
router.get('/allocation', portfolioController.getAllocation);

/**
 * @route   GET /api/portfolio/history
 * @desc    Get portfolio value history over time
 * @access  Private
 */
router.get('/history', portfolioController.getHistory);

/**
 * @route   GET /api/portfolio/performance
 * @desc    Get performance comparison data for holdings
 * @access  Private
 */
router.get('/performance', portfolioController.getPerformance);

/**
 * @route   GET /api/portfolio/:id
 * @desc    Get a single holding by ID
 * @access  Private
 */
router.get('/:id', portfolioController.getHoldingById);

/**
 * @route   PUT /api/portfolio/:id
 * @desc    Update a holding
 * @access  Private
 */
router.put('/:id', validate('updateHolding'), portfolioController.updateHolding);

/**
 * @route   DELETE /api/portfolio/:id
 * @desc    Delete a holding
 * @access  Private
 */
router.delete('/:id', portfolioController.deleteHolding);

/**
 * @route   GET /api/portfolio/export/csv
 * @desc    Export portfolio data as CSV file
 * @access  Private
 */
router.get('/export/csv', async (req, res) => {
    try {
        const csv = await exportService.generatePortfolioCSV(req.user.id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=portfolio-export.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to export portfolio' });
    }
});

module.exports = router;
