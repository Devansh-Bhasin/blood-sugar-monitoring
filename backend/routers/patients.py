
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import SessionLocal

router = APIRouter(prefix="/patients", tags=["patients"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    return crud.create_patient(db, patient)

@router.get("/", response_model=list[schemas.Patient])
def list_patients(db: Session = Depends(get_db)):
    return db.query(crud.models.Patient).all()

# Get current patient profile (assumes token contains user_id)
@router.get("/me", response_model=schemas.Patient)
def get_current_patient(request: Request, db: Session = Depends(get_db)):
    print("DEBUG /patients/me endpoint called")
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    print(f"DEBUG /patients/me token: {token}")
    import jwt
    user_id = None
    if not token:
        print("DEBUG /patients/me: missing token")
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        JWT_SECRET = "supersecretkey"  # Should match login endpoint
        JWT_ALGORITHM = "HS256"
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception as e:
        print(f"DEBUG /patients/me: error decoding JWT: {e}")
        raise HTTPException(status_code=401, detail="Invalid token format")
    print(f"DEBUG /patients/me user_id: {user_id}")
    patient = db.query(crud.models.Patient).filter_by(user_id=user_id).first()
    print(f"DEBUG /patients/me patient query result: {patient}")
    if not patient:
        print(f"DEBUG /patients/me: patient not found for user_id {user_id}")
        all_patients = db.query(crud.models.Patient.patient_id).all()
        print(f"DEBUG /patients/me: all patient_ids in DB: {[p[0] for p in all_patients]}")
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Update current patient profile
@router.put("/me", response_model=schemas.Patient)
def update_current_patient(form: schemas.PatientCreate, request: Request, db: Session = Depends(get_db)):
    print("DEBUG /patients/me PUT received:", form.dict())
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    import jwt
    user_id = None
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        JWT_SECRET = "supersecretkey"  # Should match login endpoint
        JWT_ALGORITHM = "HS256"
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token format")
    patient = db.query(crud.models.Patient).filter_by(user_id=user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Update patient fields
    patient.health_care_number = form.health_care_number
    patient.date_of_birth = form.date_of_birth
    patient.preferred_unit = form.preferred_unit
    # Update user fields
    user = patient.user
    user.full_name = form.user.full_name
    user.email = form.user.email
    user.phone = form.user.phone
    user.profile_image = form.user.profile_image
    db.commit()
    db.refresh(patient)
    return patient
