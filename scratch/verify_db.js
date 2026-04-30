const db = require('../backend/db/database');

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Error listing tables:', err);
        } else {
            console.log('Current Tables:', tables.map(t => t.name).join(', '));
        }
        process.exit(0);
    });
});
