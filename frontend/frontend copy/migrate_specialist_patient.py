import sqlite3

conn = sqlite3.connect("backend/blood_sugar.db")  # adjust path if needed
cursor = conn.cursor()

# Add columns if they don't exist
try:
    cursor.execute("ALTER TABLE specialist_patient ADD COLUMN assigned_by INTEGER;")
except sqlite3.OperationalError:
    pass  # Column already exists

try:
    cursor.execute("ALTER TABLE specialist_patient ADD COLUMN assigned_at DATETIME;")
except sqlite3.OperationalError:
    pass  # Column already exists

conn.commit()
conn.close()
print("Migration complete.")
