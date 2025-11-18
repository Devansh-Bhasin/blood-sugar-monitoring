from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend import crud
from backend.database import SessionLocal
from backend import models

router = APIRouter(prefix="/admin", tags=["admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_id(token: str):
    if token and token.startswith("token-"):
        try:
            return int(token.split("-")[1])
        except Exception:
            return None
    return None


@router.get("/summary")
def admin_summary(Authorization: str = Header(None), db: Session = Depends(get_db)):
    # Expect Authorization like: "Bearer token-<id>"
    token = Authorization.replace("Bearer ", "") if Authorization else None
    user_id = get_current_user_id(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user or user.role.upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden: admin only")

    summary = crud.get_admin_summary(db)
    return summary


@router.get("/readings/daily-averages")
def readings_daily_averages(days: int = 30, Authorization: str = Header(None), db: Session = Depends(get_db)):
    # Expect Authorization like: "Bearer token-<id>"
    token = Authorization.replace("Bearer ", "") if Authorization else None
    user_id = get_current_user_id(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user or user.role.upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden: admin only")

    days = max(1, min(365, int(days)))
    data = crud.get_readings_daily_averages(db, days=days)
    return {"days": days, "data": data}


@router.get("/uncontrolled")
def uncontrolled_patients(days: int = 30, Authorization: str = Header(None), db: Session = Depends(get_db)):
    token = Authorization.replace("Bearer ", "") if Authorization else None
    user_id = get_current_user_id(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user or user.role.upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden: admin only")

    days = max(1, min(365, int(days)))
    data = crud.get_uncontrolled_patients(db, days=days)
    return {"days": days, "data": data}
