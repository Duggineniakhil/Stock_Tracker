const db = require('../db/database');

/**
 * Portfolio Holdings Model - Repository Layer
 * Handles all database operations for portfolio holdings
 */

const portfolioModel = {
    /**
     * Create a new portfolio holding
     * @param {number} userId - User ID
     * @param {string} symbol - Stock symbol
     * @param {number} quantity - Number of shares
     * @param {number} buyPrice - Price per share at purchase
     * @param {string} buyDate - Purchase date (YYYY-MM-DD)
     * @returns {Promise<Object>} Created holding
     */
    createHolding: (userId, symbol, quantity, buyPrice, buyDate) => {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO portfolio_holdings (user_id, symbol, quantity, buy_price, buy_date)
        VALUES (?, ?, ?, ?, ?)
      `;

            db.run(sql, [userId, symbol.toUpperCase(), quantity, buyPrice, buyDate], function (err) {
                if (err) {
                    return reject(err);
                }

                // Return the created holding
                portfolioModel.getHoldingById(this.lastID, userId)
                    .then(resolve)
                    .catch(reject);
            });
        });
    },

    /**
     * Get all holdings for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Array of holdings
     */
    getHoldingsByUserId: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT * FROM portfolio_holdings
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;

            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows || []);
            });
        });
    },

    /**
     * Get a single holding by ID (with ownership check)
     * @param {number} id - Holding ID
     * @param {number} userId - User ID
     * @returns {Promise<Object|null>} Holding or null
     */
    getHoldingById: (id, userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT * FROM portfolio_holdings
        WHERE id = ? AND user_id = ?
      `;

            db.get(sql, [id, userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    },

    /**
     * Update a holding
     * @param {number} id - Holding ID
     * @param {number} userId - User ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated holding
     */
    updateHolding: (id, userId, updates) => {
        return new Promise((resolve, reject) => {
            // Build dynamic UPDATE query based on provided fields
            const allowedFields = ['symbol', 'quantity', 'buy_price', 'buy_date'];
            const setClause = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (allowedFields.includes(snakeKey)) {
                    setClause.push(`${snakeKey} = ?`);
                    values.push(updates[key]);
                }
            });

            if (setClause.length === 0) {
                return reject(new Error('No valid fields to update'));
            }

            // Always update the updated_at timestamp
            setClause.push('updated_at = CURRENT_TIMESTAMP');

            const sql = `
        UPDATE portfolio_holdings
        SET ${setClause.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

            values.push(id, userId);

            db.run(sql, values, function (err) {
                if (err) {
                    return reject(err);
                }

                if (this.changes === 0) {
                    return reject(new Error('Holding not found or unauthorized'));
                }

                // Return updated holding
                portfolioModel.getHoldingById(id, userId)
                    .then(resolve)
                    .catch(reject);
            });
        });
    },

    /**
     * Delete a holding
     * @param {number} id - Holding ID
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    deleteHolding: (id, userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
        DELETE FROM portfolio_holdings
        WHERE id = ? AND user_id = ?
      `;

            db.run(sql, [id, userId], function (err) {
                if (err) {
                    return reject(err);
                }

                if (this.changes === 0) {
                    return reject(new Error('Holding not found or unauthorized'));
                }

                resolve(true);
            });
        });
    }
};

module.exports = portfolioModel;
