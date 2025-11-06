import sqlite3

DB_PATH = "backend/blood_sugar.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Backup existing data
cursor.execute("SELECT id, specialist_id, patient_id FROM specialist_patient;")
rows = cursor.fetchall()

# Drop old table
cursor.execute("DROP TABLE IF EXISTS specialist_patient;")

# Create new table with all required columns
cursor.execute('''
CREATE TABLE specialist_patient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    specialist_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    assigned_by INTEGER,
    assigned_at DATETIME,
    UNIQUE(specialist_id, patient_id),
    FOREIGN KEY(specialist_id) REFERENCES specialists(specialist_id),
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY(assigned_by) REFERENCES clinic_staff(staff_id)
);
''')

# Restore old data (assigned_by and assigned_at will be NULL)
for row in rows:
    cursor.execute("INSERT INTO specialist_patient (id, specialist_id, patient_id) VALUES (?, ?, ?);", row)

conn.commit()
conn.close()
print("specialist_patient table recreated and data restored.")
