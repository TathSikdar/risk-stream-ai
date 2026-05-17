-- RiskStream AI Database Schema
-- Optimized for SQLite, compatible with PostgreSQL concepts.

-- 1. Users Table (Compliance Analysts)
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Compliance_Officer', 'Admin', 'Analyst')),
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transactions Table (Mock Banking Data)
CREATE TABLE IF NOT EXISTS Transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_name TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Flagged', 'Approved', 'Rejected')),
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- 3. Risk_Assessments Table (AI Orchestrator Output)
CREATE TABLE IF NOT EXISTS Risk_Assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    analyst_id INTEGER,
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
    reasoning TEXT,
    sources_checked TEXT, -- Stored as JSON string
    assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed')),
    FOREIGN KEY (transaction_id) REFERENCES Transactions(id),
    FOREIGN KEY (analyst_id) REFERENCES Users(id)
);

-- 4. Audit_Logs Table (Traceability for Compliance)
CREATE TABLE IF NOT EXISTS Audit_Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id INTEGER,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_status ON Transactions(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_transaction_id ON Risk_Assessments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON Audit_Logs(user_id);
