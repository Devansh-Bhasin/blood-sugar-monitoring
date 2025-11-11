
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal
import datetime
from backend.utils_email import send_email_alert

router = APIRouter(prefix="/alerts", tags=["alerts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.Alert)
def create_alert(alert: schemas.AlertCreate, db: Session = Depends(get_db)):
    new_alert = crud.create_alert(db, alert)
    # If abnormal_count > 3, send email to patient and specialist
    if alert.abnormal_count > 3:
        # Get patient and specialist emails
        patient = db.query(crud.models.Patient).filter_by(patient_id=alert.patient_id).first()
        specialist = db.query(crud.models.Specialist).filter_by(specialist_id=alert.specialist_id).first() if alert.specialist_id else None
        patient_email = patient.user.email if patient and patient.user else None
        specialist_email = specialist.user.email if specialist and specialist.user else None
        subject = "Blood Sugar Alert: Abnormal Readings"
        body = f"You have logged {alert.abnormal_count} abnormal blood sugar readings in the past week. Please follow up with your specialist."
        # Demo SMTP config: replace with real credentials for production
        send_email_alert(patient_email, subject, body)
        if specialist_email:
            send_email_alert(specialist_email, subject, body)
    return new_alert

@router.get("/patient/{patient_id}", response_model=list[schemas.Alert])
def get_alerts_for_patient(patient_id: int, db: Session = Depends(get_db)):
    return crud.get_alerts_for_patient(db, patient_id)

@router.post("/sample", response_model=schemas.Alert)
def create_sample_alert(db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    sample_alert = schemas.AlertCreate(
        patient_id=1,
        specialist_id=1,
        window_start=now,
        window_end=now + datetime.timedelta(days=7),
        abnormal_count=4,
        status="Queued"
    )
    return crud.create_alert(db, sample_alert)
