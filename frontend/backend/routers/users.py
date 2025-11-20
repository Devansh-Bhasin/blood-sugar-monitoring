from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

router = APIRouter(prefix="/users", tags=["users"])

from backend.database import SessionLocal
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

@router.get("/", response_model=list[schemas.User])
def list_users(db: Session = Depends(get_db)):
    return db.query(crud.models.User).all()

@router.post("/sample", response_model=schemas.User)
def create_sample_user(db: Session = Depends(get_db)):
    sample = schemas.UserCreate(
        email="sampleuser@example.com",
        password="hashedpassword",
        role="PATIENT",
        full_name="Sample User",
        phone="1234567890",
        profile_image="/images/sample.png"
    )
    return crud.create_user(db, sample)

# Admin profile endpoints
from fastapi import Header, Body
import jwt
from backend.models import User
from fastapi import Request
from backend.database import SessionLocal
from os import getenv
SECRET_KEY = getenv("SECRET_KEY", "secret")
def get_current_user_id(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id")
    except Exception:
        return None

def is_admin(db: Session, user_id: int):
    user = db.query(User).filter(User.user_id == user_id).first()
    return user and user.role.lower() == "admin"
# Admin profile endpoints


@router.get("/me", response_model=schemas.User)
def get_my_user_profile(db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Get user by id (admin only)
@router.get("/{user_id}", response_model=schemas.User)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), Authorization: str = Header(None)):
    admin_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    if not is_admin(db, admin_id):
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Delete user (admin only)
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), Authorization: str = Header(None)):
    admin_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    if not is_admin(db, admin_id):
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If user is a patient, delete readings, feedback, alerts, thresholds, etc.
    patient = db.query(crud.models.Patient).filter(crud.models.Patient.patient_id == user_id).first()
    # Always delete specialist record (and related feedback/alerts) before deleting user
    specialist = db.query(crud.models.Specialist).filter(crud.models.Specialist.user_id == user_id).first()
    if specialist:
        db.query(crud.models.Feedback).filter(crud.models.Feedback.specialist_id == specialist.specialist_id).delete()
        db.query(crud.models.Alert).filter(crud.models.Alert.specialist_id == specialist.specialist_id).delete()
        db.delete(specialist)

    # If user is a patient, delete readings, feedback, alerts, thresholds, etc.
    patient = db.query(crud.models.Patient).filter(crud.models.Patient.patient_id == user_id).first()
    if patient:
        readings = db.query(crud.models.Reading).filter(crud.models.Reading.patient_id == patient.patient_id).all()
        for reading in readings:
            db.delete(reading)
        db.query(crud.models.Feedback).filter(crud.models.Feedback.patient_id == patient.patient_id).delete()
        db.query(crud.models.Alert).filter(crud.models.Alert.patient_id == patient.patient_id).delete()
        db.query(crud.models.Threshold).filter(crud.models.Threshold.patient_id == patient.patient_id).delete()
        if hasattr(crud.models, 'AIInsight'):
            db.query(crud.models.AIInsight).filter(crud.models.AIInsight.patient_id == patient.patient_id).delete()
        db.delete(patient)

    # If user is clinic staff, delete staff record and thresholds
    staff = db.query(crud.models.ClinicStaff).filter(crud.models.ClinicStaff.staff_id == user_id).first()
    if staff:
        db.query(crud.models.Threshold).filter(crud.models.Threshold.configured_by == staff.staff_id).delete()
        db.delete(staff)

    # Commit after deleting related records to avoid FK constraint errors
    db.commit()

    # Finally, delete the user
    db.delete(user)
    db.commit()
    return

@router.put("/me", response_model=schemas.User)
def update_my_user_profile(db: Session = Depends(get_db), Authorization: str = Header(None), form: dict = Body(...)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field in ["full_name", "email", "phone", "profile_image"]:
        if field in form:
            setattr(user, field, form[field])
    db.commit()
    db.refresh(user)
    return user
