import sqlite3

DB_PATH = "backend/blood_sugar.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create specialist_patient table from scratch
cursor.execute('''
CREATE TABLE IF NOT EXISTS specialist_patient (
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

conn.commit()
conn.close()
print("specialist_patient table created.")
