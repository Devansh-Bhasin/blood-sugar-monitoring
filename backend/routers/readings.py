from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

router = APIRouter(prefix="/readings", tags=["readings"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper for categorization

def categorize_reading(value, unit):
    # Example thresholds (can be made dynamic)
    if unit == "mg_dL":
        if value < 70:
            return "Abnormal"
        elif 70 <= value <= 140:
            return "Normal"
        elif 141 <= value <= 180:
            return "Borderline"
        else:
            return "Abnormal"
    else:  # mmol_L
        if value < 4:
            return "Abnormal"
        elif 4 <= value <= 7.8:
            return "Normal"
        elif 7.9 <= value <= 10:
            return "Borderline"
        else:
            return "Abnormal"

@router.post("/", response_model=schemas.Reading)
def create_reading(reading: schemas.ReadingCreate, db: Session = Depends(get_db)):
    category = categorize_reading(reading.value, reading.unit)
    reading_data = reading.dict()
    # Insert category for DB, but don't pass to ReadingCreate
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
    db.delete(db_reading)
    db.commit()
    return {"detail": "Reading deleted"}
