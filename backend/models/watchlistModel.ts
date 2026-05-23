import db from '../db/database';

export interface WatchlistStock {
    id: number;
    user_id: number;
    symbol: string;
    created_at: string;
}

const watchlistModel = {
    // Add a stock to user's watchlist
    addStock: (userId: number, symbol: string): Promise<{ id: number; symbol: string; userId: number }> => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO user_watchlist (user_id, symbol) VALUES (?, ?)';
            db.run(query, [userId, symbol.toUpperCase()], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, symbol: symbol.toUpperCase(), userId });
                }
            });
        });
    },

    // Get all stocks in user's watchlist
    getAllStocks: (userId: number): Promise<WatchlistStock[]> => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM user_watchlist WHERE user_id = ? ORDER BY created_at DESC';
            db.all(query, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as WatchlistStock[]);
                }
            });
        });
    },

    // Remove a stock from user's watchlist
    removeStock: (userId: number, id: number | string): Promise<{ changes: number }> => {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM user_watchlist WHERE id = ? AND user_id = ?';
            db.run(query, [id, userId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    },

    // Check if stock exists in user's watchlist
    getStockBySymbol: (userId: number, symbol: string): Promise<WatchlistStock | undefined> => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM user_watchlist WHERE user_id = ? AND symbol = ?';
            db.get(query, [userId, symbol.toUpperCase()], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row as WatchlistStock | undefined);
                }
            });
        });
    }
};

export default watchlistModel;
