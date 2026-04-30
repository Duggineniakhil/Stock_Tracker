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

// Initialize database with schema
function initializeDatabase() {
    db.serialize(() => {
        // Enable WAL mode for better performance
        db.run('PRAGMA journal_mode=WAL');
        db.run('PRAGMA foreign_keys=ON');
        db.run('PRAGMA synchronous=NORMAL');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema, (err) => {
            if (err) {
                console.error('❌ Error initializing database schema:', err.message);
            } else {
                console.log('✅ Database schema initialized');
                runMigrations();
            }
        });
    });
}

// Run migrations safely (ignoring already-applied ones)
function runMigrations() {
    const migrationsPath = path.join(__dirname, 'migrations.sql');
    if (!fs.existsSync(migrationsPath)) return;

    const migrations = fs.readFileSync(migrationsPath, 'utf8');
    
    // We use db.exec for the whole file. 
    // Note: If some migrations already ran, they might fail (e.g. ALTER TABLE adding existing column).
    // To handle this gracefully in SQLite without complex versioning, we can split by statement 
    // and ignore specific "already exists" errors.
    
    const statements = migrations
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    db.serialize(() => {
        let successCount = 0;
        let skipCount = 0;
        
        statements.forEach((statement) => {
            db.run(statement, (err) => {
                if (err) {
                    if (err.message.includes('duplicate column') || 
                        err.message.includes('already exists') || 
                        err.message.includes('duplicate column name')) {
                        skipCount++;
                    } else {
                        console.error('❌ Migration error:', err.message, '\nStatement:', statement);
                    }
                } else {
                    successCount++;
                }
                
                if (successCount + skipCount === statements.length) {
                    console.log(`📊 Migrations complete: ${successCount} applied, ${skipCount} skipped/already-present`);
                }
            });
        });
    });
}

module.exports = db;
