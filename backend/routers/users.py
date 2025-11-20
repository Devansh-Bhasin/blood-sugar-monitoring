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
        # Delete related clinic_staff rows if they exist
        staff_links = db.query(crud.models.ClinicStaff).filter(crud.models.ClinicStaff.staff_id == user_id).all()
        for link in staff_links:
            db.delete(link)
        db.commit()  # Commit after deleting clinic_staff links
    from backend.routers.jwt_utils import get_user_from_jwt
    admin_user = get_user_from_jwt(Authorization, db)
    print(f"[DELETE USER DEBUG] Extracted admin_user from JWT: {admin_user}")
    if not admin_user or admin_user.role.upper() != "ADMIN":
        print(f"[DELETE USER DEBUG] is_admin failed for user {admin_user}")
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Delete related specialist_patient rows if they exist
    specialist_links = db.query(crud.models.SpecialistPatient).filter(crud.models.SpecialistPatient.patient_id == user_id).all()
    for link in specialist_links:
        db.delete(link)
    db.commit()  # Commit after deleting specialist_patient links
    # Delete related patient record(s) if they exist
    patient = db.query(crud.models.Patient).filter(crud.models.Patient.patient_id == user_id).first()
    if patient:
        db.delete(patient)
        db.commit()  # Commit after deleting patient to avoid constraint error
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
