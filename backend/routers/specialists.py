

from fastapi import APIRouter, Depends, HTTPException, Header, Body
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

router = APIRouter(prefix="/specialists", tags=["specialists"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dummy token auth for demo (replace with real auth)
def get_current_user_id(token: str):
    # token format: token-<user_id>
    if token and token.startswith("token-"):
        return int(token.split("-")[1])
    return None

# Place after router and get_db definitions
@router.get("/patients", response_model=list[schemas.Patient])
def get_my_patients(db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    specialist = db.query(crud.models.Specialist).filter(crud.models.Specialist.user_id == user_id).first()
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    assignments = db.query(crud.models.SpecialistPatient).filter_by(specialist_id=specialist.specialist_id).all()
    patient_ids = [a.patient_id for a in assignments]
    patients = db.query(crud.models.Patient).filter(crud.models.Patient.patient_id.in_(patient_ids)).all()
    return patients

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dummy token auth for demo (replace with real auth)
def get_current_user_id(token: str):
    # token format: token-<user_id>
    if token and token.startswith("token-"):
        return int(token.split("-")[1])
    return None

# Update specialist profile (user fields)
from fastapi import Body
@router.put("/me", response_model=schemas.Specialist)
def update_my_specialist_profile(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    Authorization: str = Header(None)
):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    specialist = db.query(crud.models.Specialist).filter(crud.models.Specialist.user_id == user_id).first()
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    user = specialist.user
    # Update allowed user fields only (do NOT allow specialist_code or specialist_id to be changed)
    for field in ["full_name", "email", "phone", "profile_image"]:
        if field in data:
            setattr(user, field, data[field])
    db.commit()
    db.refresh(user)
    db.refresh(specialist)
    profile_image = user.profile_image if user.profile_image else None
    return schemas.Specialist(
        specialist_id=specialist.specialist_id,
        user_id=specialist.user_id,
        specialist_code=specialist.specialist_code,
        user=schemas.User(
            user_id=user.user_id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            profile_image=profile_image,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at
        ),
        feedback=[],
        alerts=[]
    )

@router.get("/me", response_model=schemas.Specialist)
def get_my_specialist_profile(db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    specialist = db.query(crud.models.Specialist).filter(crud.models.Specialist.user_id == user_id).first()
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    # Ensure user fields are present and profile_image is None if missing
    user = specialist.user
    profile_image = user.profile_image if user.profile_image else None
    return schemas.Specialist(
        specialist_id=specialist.specialist_id,
        user_id=specialist.user_id,
        specialist_code=specialist.specialist_code,
        user=schemas.User(
            user_id=user.user_id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            profile_image=profile_image,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at
        ),
        feedback=[],
        alerts=[]
    )

@router.post("/", response_model=schemas.Specialist)
def create_specialist(specialist: schemas.SpecialistCreate, db: Session = Depends(get_db)):
    return crud.create_specialist(db, specialist)

@router.get("/", response_model=list[schemas.Specialist])
def list_specialists(db: Session = Depends(get_db)):
    return db.query(crud.models.Specialist).all()

@router.post("/sample", response_model=schemas.Specialist)
def create_sample_specialist(db: Session = Depends(get_db)):
    sample_user = schemas.UserCreate(
        email="specialist1@example.com",
        password="hashedpassword",
        role="SPECIALIST",
        full_name="Dr. Smith",
        phone="555-5678",
        profile_image="/images/smith.png"
    )
    sample_specialist = schemas.SpecialistCreate(
        user=sample_user,
        specialist_code="SPC987654"
    )
    return crud.create_specialist(db, sample_specialist)
