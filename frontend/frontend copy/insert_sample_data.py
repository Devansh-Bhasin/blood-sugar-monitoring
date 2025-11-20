import sqlite3

conn = sqlite3.connect('blood_sugar.db')
c = conn.cursor()

# USERS
data_users = [
    ('john@example.com', 'hashedpassword1', 'patient', 'John Doe', '1234567890', None),
    ('jane@example.com', 'hashedpassword2', 'patient', 'Jane Smith', '0987654321', None),
    ('alice@clinic.com', 'hashedpassword3', 'specialist', 'Dr. Alice', '1112223333', None),
    ('bob@clinic.com', 'hashedpassword4', 'specialist', 'Dr. Bob', '4445556666', None),
    ('kelly@clinic.com', 'hashedpassword5', 'staff', 'Nurse Kelly', '7778889999', None),
    ('sam@clinic.com', 'hashedpassword6', 'admin', 'Admin Sam', '0001112222', None)
]
c.executemany("INSERT INTO users (email, password_hash, role, full_name, phone, profile_image) VALUES (?, ?, ?, ?, ?, ?)", data_users)

# PATIENTS
data_patients = [
    (1, 'HCN123', '1990-01-01', 'mmol_L'),
    (2, 'HCN456', '1985-05-15', 'mmol_L')
]
c.executemany("INSERT INTO patients (patient_id, health_care_number, date_of_birth, preferred_unit) VALUES (?, ?, ?, ?)", data_patients)

# SPECIALISTS
data_specialists = [
    (3, 'SPC001'),
    (4, 'SPC002')
]
c.executemany("INSERT INTO specialists (specialist_id, specialist_code) VALUES (?, ?)", data_specialists)

# CLINIC STAFF
data_staff = [
    (5,)
]
c.executemany("INSERT INTO clinic_staff (staff_id) VALUES (?)", data_staff)

# READINGS
data_readings = [
    (1, 120.5, '2025-11-03 08:00:00', 'mmol_L', 'fasting', 'Toast', 'Walking', 'Breakfast', 'None', 'Feeling good'),
    (2, 150.2, '2025-11-03 09:00:00', 'mmol_L', 'postprandial', 'Rice', 'Resting', 'Lunch', 'Headache', 'Slight headache')
]
c.executemany("INSERT INTO readings (patient_id, value, timestamp, unit, category, food_intake, activities, event, symptom, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", data_readings)

# AI INSIGHTS
data_ai = [
    (1, 3, 'food', 'Toast', 2, 'Reduce carb intake at breakfast.'),
    (2, 4, 'event', 'Lunch', 3, 'Monitor readings after lunch.')
]
c.executemany("INSERT INTO ai_insights (patient_id, specialist_id, trigger_type, trigger_value, abnormal_count, suggestion) VALUES (?, ?, ?, ?, ?, ?)", data_ai)

# FEEDBACK
data_feedback = [
    (3, 1, 1, 'Good control, keep it up!'),
    (4, 2, 2, 'Monitor after meals.')
]
c.executemany("INSERT INTO feedback (specialist_id, patient_id, reading_id, comments) VALUES (?, ?, ?, ?)", data_feedback)

# THRESHOLDS
data_thresholds = [
    (80, 140, 160, 5),
    (90, 160, 180, 5)
]
c.executemany("INSERT INTO thresholds (min_normal, max_normal, max_borderline, configured_by) VALUES (?, ?, ?, ?)", data_thresholds)

# ALERTS
data_alerts = [
    (1, 3, '2025-11-03 08:00:00', '2025-11-03 09:00:00', 1, 'active'),
    (2, 4, '2025-11-03 09:00:00', '2025-11-03 10:00:00', 2, 'resolved')
]
c.executemany("INSERT INTO alerts (patient_id, specialist_id, window_start, window_end, abnormal_count, status) VALUES (?, ?, ?, ?, ?, ?)", data_alerts)

# REPORTS
data_reports = [
    (6, 'week', '2025-10-27', '2025-11-03', '{"patients":2,"readings":2}', '{"food":{"Toast":2},"event":{"Lunch":3}}')
]
c.executemany("INSERT INTO reports (admin_id, period, period_start, period_end, patient_statistics, trigger_summary) VALUES (?, ?, ?, ?, ?, ?)", data_reports)

conn.commit()
conn.close()
print("Sample data inserted.")
