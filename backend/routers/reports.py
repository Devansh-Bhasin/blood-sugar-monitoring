from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal
import datetime

router = APIRouter(prefix="/reports", tags=["reports"])

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

@router.get("/generate/{period_start}/{period_end}", response_model=dict)
def generate_report(period_start: str, period_end: str, db: Session = Depends(get_db)):
    start = datetime.datetime.strptime(period_start, "%Y-%m-%d").date()
    end = datetime.datetime.strptime(period_end, "%Y-%m-%d").date()
    readings = db.query(crud.models.Reading).all()
    readings_dicts = [
        {
            'patient_id': r.patient_id,
            'value': float(r.value),
            'unit': r.unit,
            'category': r.category,
            'food_intake': r.food_intake,
            'timestamp': r.timestamp
        } for r in readings
    ]
    stats, trigger_summary = report_generation(readings_dicts, start, end)
    return {'patient_statistics': stats, 'trigger_summary': trigger_summary}
