import os
import sqlite3

# Senior SWE: Prepare the database for production by clearing all mock transactional data
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, "risk_stream_ai.db")

def clear_dummy_data():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Clear Risk Assessments (Dependent on Transactions)
        cursor.execute("DELETE FROM Risk_Assessments")
        print("Cleared Risk_Assessments table.")

        # 2. Clear Transactions
        cursor.execute("DELETE FROM Transactions")
        print("Cleared Transactions table.")

        # 3. Clear Audit Logs (Optional, but often requested for clean slate)
        cursor.execute("DELETE FROM Audit_Logs")
        print("Cleared Audit_Logs table.")

        # 4. Reset Autoincrement sequences
        cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('Transactions', 'Risk_Assessments', 'Audit_Logs')")
        print("Reset primary key sequences.")

        conn.commit()
        print("\nProduction Transition: All dummy transactional data removed successfully.")
        print("User accounts have been preserved for system access.")

    except Exception as e:
        print(f"Error during data clearance: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    clear_dummy_data()
