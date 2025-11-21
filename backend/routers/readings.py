from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

router = APIRouter(prefix="/readings", tags=["readings"])

from backend.database import SessionLocal
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper for categorization

def categorize_reading(value, unit, patient_id=None, db=None):
    threshold = None
    if db is not None and patient_id is not None:
        threshold = db.query(crud.models.Threshold).filter(crud.models.Threshold.patient_id == patient_id).first()
    if unit == "mg_dL":
        min_normal = float(threshold.min_normal) if threshold else 70
        max_normal = float(threshold.max_normal) if threshold else 140
        max_borderline = float(threshold.max_borderline) if threshold else 180
        if value < min_normal:
            return "Abnormal"
        elif min_normal <= value <= max_normal:
            return "Normal"
        elif max_normal < value <= max_borderline:
            return "Borderline"
        else:
            return "Abnormal"
    else:  # mmol_L
        min_normal = float(threshold.min_normal) if threshold else 4
        max_normal = float(threshold.max_normal) if threshold else 7.8
        max_borderline = float(threshold.max_borderline) if threshold else 10
        if value < min_normal:
            return "Abnormal"
        elif min_normal <= value <= max_normal:
            return "Normal"
        elif max_normal < value <= max_borderline:
            return "Borderline"
        else:
            return "Abnormal"

@router.post("/", response_model=schemas.Reading)
def create_reading(reading: schemas.ReadingCreate, db: Session = Depends(get_db)):
    import datetime
    from backend.utils_email import send_email_alert
    category = categorize_reading(reading.value, reading.unit, patient_id=reading.patient_id, db=db)
    db_reading = crud.create_reading(db, schemas.ReadingCreate(
        patient_id=reading.patient_id,
        value=reading.value,
        unit=reading.unit,
        food_intake=reading.food_intake,
        activities=reading.activities,
        event=reading.event,
        symptom=reading.symptom,
        notes=reading.notes,
        category=category
    ))

    # After saving, check for abnormal readings in the last 7 days
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    abnormal_readings = db.query(crud.models.Reading).filter(
        crud.models.Reading.patient_id == reading.patient_id,
        crud.models.Reading.category == "Abnormal",
        crud.models.Reading.timestamp >= seven_days_ago
    ).all()
    abnormal_count = len(abnormal_readings)
    if abnormal_count >= 3:
        # Check if an alert for this window already exists to avoid duplicates
        existing_alert = db.query(crud.models.Alert).filter(
            crud.models.Alert.patient_id == reading.patient_id,
            crud.models.Alert.window_start >= seven_days_ago
        ).first()
        if not existing_alert:
            # Find assigned specialist (if any)
            specialist_patient = db.query(crud.models.SpecialistPatient).filter(
                crud.models.SpecialistPatient.patient_id == reading.patient_id
            ).order_by(crud.models.SpecialistPatient.assigned_at.desc()).first()
            specialist_id = specialist_patient.specialist_id if specialist_patient else None
            alert = schemas.AlertCreate(
                patient_id=reading.patient_id,
                specialist_id=specialist_id,
                window_start=seven_days_ago,
                window_end=datetime.datetime.utcnow(),
                abnormal_count=abnormal_count,
                status="Queued"
            )
            new_alert = crud.create_alert(db, alert)
            # Send emails
            patient = db.query(crud.models.Patient).filter_by(patient_id=reading.patient_id).first()
            specialist = db.query(crud.models.Specialist).filter_by(specialist_id=specialist_id).first() if specialist_id else None
            patient_email = patient.user.email if patient and patient.user else None
            specialist_email = specialist.user.email if specialist and specialist.user else None
            subject = "Blood Sugar Alert: Abnormal Readings"
            body = f"You have logged {abnormal_count} abnormal blood sugar readings in the past week. Please follow up with your specialist."
            if patient_email:
                send_email_alert(patient_email, subject, body)
            if specialist_email:
                send_email_alert(specialist_email, subject, body)
    return db_reading

@router.get("/patient/{patient_id}", response_model=list[schemas.Reading])
def get_readings(patient_id: int, db: Session = Depends(get_db)):
    return crud.get_readings(db, patient_id)

@router.post("/sample", response_model=schemas.Reading)
def create_sample_reading(db: Session = Depends(get_db)):
    sample_reading = schemas.ReadingCreate(
        patient_id=1,
        value=180.5,
        unit="mg_dL",
        category="Abnormal",
        food_intake="Pasta",
        activities="Exercise",
        notes="High after lunch"
    )
    return crud.create_reading(db, sample_reading)

from backend.utils_ai import ai_pattern_detection

@router.get("/ai_suggestions/{patient_id}", response_model=list[str])
def get_ai_suggestions(patient_id: int, db: Session = Depends(get_db)):
    readings = crud.get_readings(db, patient_id)
    readings_dicts = [
        {
            'value': float(r.value),
            'unit': r.unit,
            'category': r.category,
            'food_intake': r.food_intake,
            'timestamp': r.timestamp
        } for r in readings
    ]
    return ai_pattern_detection(readings_dicts)

# Update a reading
@router.put("/{reading_id}", response_model=schemas.Reading)
def update_reading(reading_id: int, reading: schemas.ReadingCreate, db: Session = Depends(get_db)):
    db_reading = db.query(crud.models.Reading).filter(crud.models.Reading.reading_id == reading_id).first()
    if not db_reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    for field in ["value", "unit", "food_intake", "activities", "event", "symptom", "notes"]:
        if hasattr(reading, field):
            setattr(db_reading, field, getattr(reading, field))
    db_reading.category = categorize_reading(reading.value, reading.unit)
    db.commit()
    db.refresh(db_reading)
    return db_reading

# Delete a reading
@router.delete("/{reading_id}")
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    db_reading = db.query(crud.models.Reading).filter(crud.models.Reading.reading_id == reading_id).first()
    if not db_reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    # Delete all feedback associated with this reading first
    feedbacks = db.query(crud.models.Feedback).filter(crud.models.Feedback.reading_id == reading_id).all()
    for fb in feedbacks:
        db.delete(fb)
    db.delete(db_reading)
    db.commit()
    return {"detail": "Reading deleted"}
