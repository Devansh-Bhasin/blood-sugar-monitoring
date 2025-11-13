from fastapi import APIRouter, Depends, HTTPException
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
def get_current_user_id(token: str):
    if token and token.startswith("token-"):
        return int(token.split("-")[1])
    return None

@router.get("/me", response_model=schemas.User)
def get_my_user_profile(db: Session = Depends(get_db), Authorization: str = Header(None)):
    user_id = get_current_user_id(Authorization.replace("Bearer ", "") if Authorization else None)
    user = db.query(crud.models.User).filter(crud.models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

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
