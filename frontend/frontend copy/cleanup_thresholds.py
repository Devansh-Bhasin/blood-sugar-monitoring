import sqlite3

DB_PATH = "blood_sugar.db"

def cleanup_thresholds():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Keep only the most recent threshold (by updated_at)
    cursor.execute("SELECT threshold_id FROM thresholds ORDER BY updated_at DESC LIMIT 1")
    row = cursor.fetchone()
    if row:
        keep_id = row[0]
        cursor.execute("DELETE FROM thresholds WHERE threshold_id != ?", (keep_id,))
        conn.commit()
        print(f"Kept threshold_id={keep_id}, deleted all others.")
    else:
        print("No thresholds found.")
    conn.close()

if __name__ == "__main__":
    cleanup_thresholds()
