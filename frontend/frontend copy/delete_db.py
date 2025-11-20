import os

db_path = "backend/blood_sugar.db"
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Deleted {db_path}. Database will be recreated on next backend start.")
else:
    print(f"{db_path} does not exist. Nothing to delete.")
