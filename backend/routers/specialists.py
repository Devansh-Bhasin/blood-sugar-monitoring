# Admin-only: List all specialists
@router.get("/all", response_model=list[schemas.Specialist])
def list_all_specialists(db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    if not user_id or not is_admin(db, user_id):
        raise HTTPException(status_code=403, detail="Admin only")
    return db.query(crud.models.Specialist).all()


from fastapi import APIRouter, Depends, HTTPException, Header, Body
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal
from backend.utils import get_current_user_id
def is_admin(db, user_id):
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    return user and user.role.lower() == "admin"

router = APIRouter(prefix="/specialists", tags=["specialists"])

from backend.database import SessionLocal
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

## JWT helper now imported from utils


# Place after router and get_db definitions
@router.get("/patients", response_model=list[schemas.Patient])
def get_my_patients(db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    specialist = db.query(crud.models.Specialist).filter(crud.models.Specialist.user_id == user_id).first()
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    assignments = db.query(crud.models.SpecialistPatient).filter_by(specialist_id=specialist.specialist_id).all()
    patient_ids = [a.patient_id for a in assignments]
    patients = db.query(crud.models.Patient).filter(crud.models.Patient.patient_id.in_(patient_ids)).all()
    return patients

# Admin-only: Create specialist
@router.post("/", response_model=schemas.Specialist)
def create_specialist(specialist: schemas.SpecialistCreate, db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    if not user_id or not is_admin(db, user_id):
        raise HTTPException(status_code=403, detail="Admin only")
    # Actual creation logic
    return crud.create_specialist(db, specialist)

# Admin-only: Update specialist
@router.put("/{specialist_id}", response_model=schemas.Specialist)
def update_specialist(specialist_id: int, specialist: schemas.SpecialistCreate, db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    if not user_id or not is_admin(db, user_id):
        raise HTTPException(status_code=403, detail="Admin only")
    # Actual update logic
    db_specialist = db.query(crud.models.Specialist).filter(crud.models.Specialist.specialist_id == specialist_id).first()
    if not db_specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    # Update fields
    for field in ["specialist_code"]:
        if hasattr(specialist, field):
            setattr(db_specialist, field, getattr(specialist, field))
    db.commit()
    db.refresh(db_specialist)
    return db_specialist


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

from fastapi import Header

@router.post("/", response_model=schemas.Specialist)
def create_specialist(specialist: schemas.SpecialistCreate, db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization)
    if not user_id or not is_admin(db, user_id):
        raise HTTPException(status_code=403, detail="Admin only")
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
