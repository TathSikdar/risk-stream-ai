import os
import sqlite3
import json
import bcrypt
from datetime import datetime

# Senior SWE: Use absolute paths relative to this file to ensure it runs from any CWD
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, "risk_stream_ai.db")
SCHEMA_PATH = os.path.join(CURRENT_DIR, "schema.sql")

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt for secure storage."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Apply Schema
    with open(SCHEMA_PATH, 'r') as f:
        schema_sql = f.read()
    cursor.executescript(schema_sql)
    print("Schema applied successfully.")

    # 2. Seed Users
    # Securely hash passwords (the word 'password' for all for now)
    common_password = hash_password('password')
    users = [
        ('admin', hash_password('admin_secure_pass'), 'Admin', 'System Administrator'),
        ('jdoe', common_password, 'Compliance_Officer', 'Jane Doe'),
        ('asmith', common_password, 'Analyst', 'Adam Smith')
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO Users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)",
        users
    )
    print(f"Seeded {len(users)} users.")

    # 3. Seed Transactions (Semiconductor Focus)
    transactions = [
        ('AMD', 'TSMC', 45000000.00, 'USD', 'Pending', 'Payment for wafers - 5nm process node'),
        ('Micron Technology', 'Apex Electronics', 1200000.00, 'USD', 'Pending', 'Batch memory module shipment'),
        ('GlobalFoundries', 'NVIDIA', 2500000.00, 'USD', 'Pending', 'Specialized chip manufacturing services'),
        ('SMIC', 'Regional Distributor X', 8900000.00, 'USD', 'Flagged', 'Bulk IC export - high risk entity'),
        ('NVIDIA', 'Data Center Solutions', 15000000.00, 'USD', 'Pending', 'AI Accelerator deployment payment'),
        ('Broadcom', 'Cisco Systems', 3500.00, 'USD', 'Approved', 'Hardware component sample order')
    ]
    cursor.executemany(
        "INSERT INTO Transactions (sender_name, receiver_name, amount, currency, status, description) VALUES (?, ?, ?, ?, ?, ?)",
        transactions
    )
    print(f"Seeded {len(transactions)} transactions.")

    conn.commit()
    conn.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_database()
