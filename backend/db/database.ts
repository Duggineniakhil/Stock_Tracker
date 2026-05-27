import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, 'stocks.db');
const isTest = process.env.NODE_ENV === 'test';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, (err) => {
    if (err) {
        if (!isTest) console.error('Error opening database:', err.message);
    } else {
        if (!isTest) console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        db.run('PRAGMA journal_mode=WAL');
        db.run('PRAGMA foreign_keys=ON');
        db.run('PRAGMA synchronous=NORMAL');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema, (err) => {
            if (err) {
                if (!isTest) console.error('Error initializing database schema:', err.message);
            } else {
                if (!isTest) console.log('Database schema initialized');
                runMigrations();
            }
        });
    });
}

function runMigrations() {
    const migrationsPath = path.join(__dirname, 'migrations.sql');
    if (!fs.existsSync(migrationsPath)) return;

    const migrations = fs.readFileSync(migrationsPath, 'utf8');
    const statements = migrations
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    db.serialize(() => {
        let successCount = 0;
        let skipCount = 0;

        statements.forEach((statement) => {
            db.run(statement, (err) => {
                if (err) {
                    if (
                        err.message.includes('duplicate column') ||
                        err.message.includes('already exists') ||
                        err.message.includes('duplicate column name')
                    ) {
                        skipCount++;
                    } else if (!isTest) {
                        console.error('Migration error:', err.message, '\nStatement:', statement);
                    }
                } else {
                    successCount++;
                }

                if (!isTest && successCount + skipCount === statements.length) {
                    console.log(`Migrations complete: ${successCount} applied, ${skipCount} skipped/already-present`);
                }
            });
        });
    });
}

export = db;
