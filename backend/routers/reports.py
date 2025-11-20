from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal
import datetime
import jwt
from backend.models import User
from os import getenv
SECRET_KEY = getenv("SECRET_KEY", "secret")

router = APIRouter(prefix="/reports", tags=["reports"])

from backend.database import SessionLocal
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Report)
def create_report(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    return crud.create_report(db, report)

@router.get("/", response_model=list[schemas.Report])
def list_reports(db: Session = Depends(get_db)):
    return crud.get_reports(db)

@router.post("/sample", response_model=schemas.Report)
def create_sample_report(db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    sample_report = schemas.ReportCreate(
        period="Monthly",
        period_start=now.date(),
        period_end=(now + datetime.timedelta(days=30)).date(),
        patient_statistics='{"active_patients": 10, "avg": 120, "max": 200, "min": 80}',
        trigger_summary='{"top_foods": ["Pasta", "Rice"]}'
    )
    return crud.create_report(db, sample_report)

from backend.utils_ai import report_generation


# Helper: check admin
def is_admin(db: Session, user_id: int):
    user = db.query(User).filter(User.user_id == user_id).first()
    return user and user.role.lower() == "admin"

@router.get("/generate", response_model=dict)
def generate_report(
    period_type: str = "monthly",
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
    Authorization: str = Header(None)
):
    # Admin check (use sub and role from JWT, like other admin endpoints)
    token = Authorization.replace("Bearer ", "") if Authorization else None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload.get("sub")) if payload.get("sub") else None
        role = payload.get("role", "").lower()
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid token")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    today = datetime.date.today()
    if not year:
        year = today.year
    if period_type == "monthly":
        if not month:
            month = today.month
        start = datetime.date(year, month, 1)
        if month == 12:
            end = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            end = datetime.date(year, month + 1, 1) - datetime.timedelta(days=1)
        period_label = f"{year}-{month:02d}"
    elif period_type == "yearly":
        start = datetime.date(year, 1, 1)
        end = datetime.date(year, 12, 31)
        period_label = str(year)
    else:
        raise HTTPException(status_code=400, detail="Invalid period_type")

    # Query readings in period
    readings = db.query(crud.models.Reading).filter(
        crud.models.Reading.timestamp >= start,
        crud.models.Reading.timestamp <= end
    ).all()

    # Per-patient stats
    from collections import defaultdict
    patient_stats = defaultdict(lambda: {"values": []})
    for r in readings:
        patient_stats[r.patient_id]["values"].append(float(r.value))
    patient_summary = []
    for pid, data in patient_stats.items():
        vals = data["values"]
        avg = sum(vals) / len(vals) if vals else 0
        min_v = min(vals) if vals else 0
        max_v = max(vals) if vals else 0
        user = db.query(User).filter(User.user_id == pid).first()
        patient_summary.append({
            "patient_id": pid,
            "full_name": user.full_name if user else None,
            "avg": avg,
            "min": min_v,
            "max": max_v
        })

    # Top food/activity triggers (AI insights)
    ai_insights = db.query(crud.models.AIInsight).filter(
        crud.models.AIInsight.created_at >= start,
        crud.models.AIInsight.created_at <= end
    ).all()
    from collections import Counter
    food_triggers = Counter()
    activity_triggers = Counter()
    for insight in ai_insights:
        if insight.trigger_type == "food" and insight.trigger_value:
            food_triggers[insight.trigger_value] += insight.abnormal_count
        if insight.trigger_type == "activity" and insight.trigger_value:
            activity_triggers[insight.trigger_value] += insight.abnormal_count
    top_foods = food_triggers.most_common(5)
    top_activities = activity_triggers.most_common(5)

    return {
        "period": period_label,
        "period_start": str(start),
        "period_end": str(end),
        "total_active_patients": len(patient_stats),
        "patients": patient_summary,
        "top_food_triggers": top_foods,
        "top_activity_triggers": top_activities
    }
