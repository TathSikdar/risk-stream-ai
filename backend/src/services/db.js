const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

const DB_ENGINE = process.env.DB_ENGINE || 'SQLITE';

let db;
let pool;

if (DB_ENGINE === 'POSTGRES') {
    pool = new Pool({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT || 5432,
    });
    console.log('PostgreSQL Pool initialized.');
} else {
    // Senior SWE: Support environment-driven database path for Docker/Local flexibility
    const DEFAULT_PATH = path.resolve(__dirname, '../../../database/risk_stream_ai.db');
    const DB_PATH = process.env.DATABASE_URL || DEFAULT_PATH;
    
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Database connection error:', err.message);
        } else {
            console.log('Connected to RiskStream AI SQLite database.');
        }
    });
}

/**
 * Promisified query helper for Senior SWE standard.
 * Works for both SQLite and PostgreSQL.
 */
const query = async (sql, params = []) => {
    if (DB_ENGINE === 'POSTGRES') {
        const res = await pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return res.rows;
    }
    
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const get = async (sql, params = []) => {
    if (DB_ENGINE === 'POSTGRES') {
        const res = await pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return res.rows[0];
    }

    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const run = async (sql, params = []) => {
    if (DB_ENGINE === 'POSTGRES') {
        const res = await pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return { id: res.insertId, changes: res.rowCount };
    }

    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

module.exports = {
    query,
    get,
    run
};
