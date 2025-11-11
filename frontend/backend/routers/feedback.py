from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

router = APIRouter(prefix="/feedback", tags=["feedback"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Feedback)
def create_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    return crud.create_feedback(db, feedback)

@router.get("/patient/{patient_id}", response_model=list[schemas.Feedback])
def get_feedback_for_patient(patient_id: int, db: Session = Depends(get_db)):
    return crud.get_feedback_for_patient(db, patient_id)

@router.post("/sample", response_model=schemas.Feedback)
def create_sample_feedback(db: Session = Depends(get_db)):
    sample_feedback = schemas.FeedbackCreate(
        specialist_id=1,
        patient_id=1,
        reading_id=1,
        comments="Increase exercise after high-carb meals."
    )
    return crud.create_feedback(db, sample_feedback)
