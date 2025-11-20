import sqlite3

conn = sqlite3.connect("backend/blood_sugar.db")
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(specialist_patient);")
columns = cursor.fetchall()
for col in columns:
    print(col)
conn.close()
