const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'stocks.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Enable WAL mode for better performance
db.run('PRAGMA journal_mode=WAL');
db.run('PRAGMA foreign_keys=ON');
db.run('PRAGMA synchronous=NORMAL');

// Initialize database with schema
function initializeDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database schema:', err.message);
        } else {
            console.log('Database schema initialized');
            runMigrations();
        }
    });
}

// Run migrations safely (ignoring already-applied ones)
function runMigrations() {
    const migrationsPath = path.join(__dirname, 'migrations.sql');
    if (!fs.existsSync(migrationsPath)) return;

    const migrations = fs.readFileSync(migrationsPath, 'utf8');
    const statements = migrations
        .split(';')
        .map(s => {
            // Strip comment-only lines, then trim
            return s.split('\n')
                .filter(line => !line.trim().startsWith('--'))
                .join('\n')
                .trim();
        })
        .filter(s => s.length > 0);

    let completed = 0;
    statements.forEach((statement) => {
        db.run(statement, (err) => {
            if (err && !err.message.includes('duplicate column') && !err.message.includes('already exists')) {
                console.warn('Migration warning:', err.message.substring(0, 80));
            }
            completed++;
            if (completed === statements.length) {
                console.log('Database migrations applied');
            }
        });
    });
}

module.exports = db;
