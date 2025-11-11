from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

router = APIRouter(prefix="/thresholds", tags=["thresholds"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Threshold)
def create_threshold(threshold: schemas.ThresholdCreate, db: Session = Depends(get_db)):
    return crud.create_threshold(db, threshold)

@router.get("/", response_model=list[schemas.Threshold])
def list_thresholds(db: Session = Depends(get_db)):
    return crud.get_thresholds(db)

@router.post("/sample", response_model=schemas.Threshold)
def create_sample_threshold(db: Session = Depends(get_db)):
    sample_threshold = schemas.ThresholdCreate(
        min_normal=70.0,
        max_normal=130.0,
        max_borderline=180.0,
        configured_by=1
    )
    return crud.create_threshold(db, sample_threshold)
