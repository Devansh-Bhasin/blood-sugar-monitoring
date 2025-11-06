import sqlite3
import datetime

DB_PATH = "blood_sugar.db"  # Update this path if your DB file is elsewhere

def fix_thresholds_updated_at():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.datetime.utcnow().isoformat(sep=' ', timespec='seconds')
    cursor.execute("UPDATE thresholds SET updated_at = ? WHERE updated_at IS NULL", (now,))
    conn.commit()
    print("Updated all NULL updated_at values in thresholds table.")
    conn.close()

if __name__ == "__main__":
    fix_thresholds_updated_at()
