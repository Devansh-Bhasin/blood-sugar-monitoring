from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

# Define router before any usage
router = APIRouter(prefix="/users", tags=["users"])


# Debug endpoint to confirm router is active
@router.get("/debug")
def debug_users_router():
    return {"status": "users router active"}

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
        # Use 'sub' field, which is the user_id in your JWTs
        return int(payload.get("sub")) if payload.get("sub") else None
    except Exception:
        return None

def is_admin(db: Session, user_id: int):
    user = db.query(User).filter(User.user_id == user_id).first()
    return user and user.role.lower() == "admin"
# Admin profile endpoints


@router.get("/me", response_model=schemas.User)
def get_my_user_profile(db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    print(f"[DEBUG /me] Extracted user_id from JWT: {user_id}")
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    print(f"[DEBUG /me] User found in DB: {user}")
    if not user:
        print(f"[DEBUG /me] No user found for user_id: {user_id}")
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
    # Admin check
    admin_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    if not is_admin(db, admin_id):
        raise HTTPException(status_code=403, detail="Admin only")

    # Delete all SpecialistPatient records where user is a patient or specialist
    if hasattr(crud.models, 'SpecialistPatient'):
        db.query(crud.models.SpecialistPatient).filter(
            (crud.models.SpecialistPatient.patient_id == user_id) |
            (crud.models.SpecialistPatient.specialist_id == user_id)
        ).delete()

    # Delete all Appointments where user is a patient or specialist
    if hasattr(crud.models, 'Appointment'):
        db.query(crud.models.Appointment).filter(
            (crud.models.Appointment.patient_id == user_id) |
            (crud.models.Appointment.specialist_id == user_id)
        ).delete()

    # Delete related patient record(s) and their dependencies
    patient = db.query(crud.models.Patient).filter(crud.models.Patient.patient_id == user_id).first()
    if patient:
        db.query(crud.models.Reading).filter(crud.models.Reading.patient_id == user_id).delete()
        db.query(crud.models.Feedback).filter(crud.models.Feedback.patient_id == user_id).delete()
        db.query(crud.models.Alert).filter(crud.models.Alert.patient_id == user_id).delete()
        db.query(crud.models.Threshold).filter(crud.models.Threshold.patient_id == user_id).delete()
        if hasattr(crud.models, 'AIInsight'):
            db.query(crud.models.AIInsight).filter(crud.models.AIInsight.patient_id == user_id).delete()
        db.delete(patient)

    # Delete related specialist record(s) and their dependencies
    specialists = db.query(crud.models.Specialist).filter(crud.models.Specialist.user_id == user_id).all()
    for specialist in specialists:
        db.query(crud.models.Feedback).filter(crud.models.Feedback.specialist_id == specialist.specialist_id).delete()
        db.query(crud.models.Alert).filter(crud.models.Alert.specialist_id == specialist.specialist_id).delete()
        if hasattr(crud.models, 'AIInsight'):
            db.query(crud.models.AIInsight).filter(crud.models.AIInsight.specialist_id == specialist.specialist_id).delete()
        db.delete(specialist)

    # Delete related clinic_staff rows if they exist
    staff_links = db.query(crud.models.ClinicStaff).filter(crud.models.ClinicStaff.staff_id == user_id).all()
    for link in staff_links:
        db.delete(link)

    # Delete thresholds configured by staff
    db.query(crud.models.Threshold).filter(crud.models.Threshold.configured_by == user_id).delete()

    # Commit after deleting related records to avoid FK constraint errors
    db.commit()

    # Finally, delete the user
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
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
