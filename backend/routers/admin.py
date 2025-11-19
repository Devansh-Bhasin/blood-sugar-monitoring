

print("[ADMIN ROUTER] Loaded")
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend import crud
from backend.database import SessionLocal
from backend import models
from backend.routers.jwt_utils import get_user_from_jwt

router = APIRouter(prefix="/admin", tags=["admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()





@router.get("/summary")
def admin_summary(Authorization: str = Header(None), db: Session = Depends(get_db)):
    print("[ADMIN ROUTER] admin_summary called, Authorization:", Authorization)
    user = get_user_from_jwt(Authorization, db)
    if user.role.upper() != "ADMIN":
        print(f"[ADMIN ROUTER] Forbidden: user role is {user.role}")
        raise HTTPException(status_code=403, detail="Forbidden: admin only")
    summary = crud.get_admin_summary(db)
    return summary


@router.get("/readings/daily-averages")
def readings_daily_averages(days: int = 30, Authorization: str = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_jwt(Authorization, db)
    if user.role.upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden: admin only")
    days = max(1, min(365, int(days)))
    data = crud.get_readings_daily_averages(db, days=days)
    return {"days": days, "data": data}


@router.get("/uncontrolled")
def uncontrolled_patients(days: int = 30, Authorization: str = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_jwt(Authorization, db)
    if user.role.upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden: admin only")
    days = max(1, min(365, int(days)))
    data = crud.get_uncontrolled_patients(db, days=days)
    return {"days": days, "data": data}
