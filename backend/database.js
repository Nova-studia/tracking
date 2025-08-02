const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'contracts.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with contracts table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_number TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        full_name TEXT,
        address TEXT,
        signature_data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT
    )`);
    
    // Add new columns to existing table if they don't exist
    db.run(`ALTER TABLE contracts ADD COLUMN phone_number TEXT`, () => {});
    db.run(`ALTER TABLE contracts ADD COLUMN full_name TEXT`, () => {});
    db.run(`ALTER TABLE contracts ADD COLUMN address TEXT`, () => {});
});

module.exports = db;