from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas


router = APIRouter(prefix="/clinic_staff", tags=["clinic_staff"])

from backend.database import SessionLocal
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dummy token auth for demo (replace with real auth)
import jwt
JWT_SECRET = "supersecretkey"  # Must match the value in auth.py
def get_current_user_id(token: str):
    if not token:
        return None
    try:
        # Remove 'Bearer ' if present
        if token.startswith("Bearer "):
            token = token[len("Bearer "):]
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return int(payload.get("sub"))
    except Exception as e:
        print(f"JWT decode error: {e}")
        return None

from fastapi import Header

@router.get("/me", response_model=schemas.ClinicStaff)
def get_my_clinic_staff_profile(db: Session = Depends(get_db), Authorization: str = Header(None)):
    print(f"DEBUG /clinic_staff/me Authorization header: {Authorization}")
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    print(f"DEBUG /clinic_staff/me parsed user_id: {user_id}")
    staff = db.query(crud.models.ClinicStaff).filter(crud.models.ClinicStaff.staff_id == user_id).first()
    print(f"DEBUG /clinic_staff/me staff query result: {staff}")
    if not staff:
        print(f"DEBUG /clinic_staff/me: No staff found for user_id {user_id}")
        raise HTTPException(status_code=404, detail="Clinic staff not found")
    return staff

# Allow staff to update their profile
from fastapi import Body
@router.put("/me", response_model=schemas.ClinicStaff)
def update_my_clinic_staff_profile(
    db: Session = Depends(get_db),
    Authorization: str = Header(None),
    form: dict = Body(...)
):
    print(f"DEBUG /clinic_staff/me [PUT] Authorization header: {Authorization}")
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    print(f"DEBUG /clinic_staff/me [PUT] parsed user_id: {user_id}")
    staff = db.query(crud.models.ClinicStaff).filter(crud.models.ClinicStaff.staff_id == user_id).first()
    print(f"DEBUG /clinic_staff/me [PUT] staff query result: {staff}")
    if not staff:
        print(f"DEBUG /clinic_staff/me [PUT]: No staff found for user_id {user_id}")
        raise HTTPException(status_code=404, detail="Clinic staff not found")
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        print(f"DEBUG /clinic_staff/me [PUT]: No user found for user_id {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    # Update allowed fields
    for field in ["full_name", "email", "phone", "profile_image"]:
        if field in form:
            setattr(user, field, form[field])
    db.commit()
    db.refresh(staff)
    return staff

@router.post("/", response_model=schemas.ClinicStaff)
def create_clinic_staff(staff: schemas.ClinicStaffCreate, db: Session = Depends(get_db)):
    return crud.create_clinic_staff(db, staff)

@router.get("/", response_model=list[schemas.ClinicStaff])
def list_clinic_staff(db: Session = Depends(get_db)):
    return db.query(crud.models.ClinicStaff).all()

@router.post("/sample", response_model=schemas.ClinicStaff)
def create_sample_clinic_staff(db: Session = Depends(get_db)):
    sample_user = schemas.UserCreate(
        email="staff1@example.com",
        password="hashedpassword",
        role="CLINIC_STAFF",
        full_name="Jane Staff",
        phone="555-9999",
        profile_image="/images/jane.png"
    )
    sample_staff = schemas.ClinicStaffCreate(
        user=sample_user
    )
    return crud.create_clinic_staff(db, sample_staff)
