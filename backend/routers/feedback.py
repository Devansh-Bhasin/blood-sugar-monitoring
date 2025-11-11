from fastapi import APIRouter, Depends, HTTPException, Header
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
def create_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db), Authorization: str = Header(None)):
    import jwt
    import os
    from jwt import ExpiredSignatureError, InvalidTokenError
    try:
        # Always look up specialist_id from user_id in token
        user_id = None
        if Authorization:
            token = Authorization.replace("Bearer ", "")
            JWT_SECRET = "supersecretkey"  # Should match login endpoint
            JWT_ALGORITHM = "HS256"
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_id = int(payload.get("sub"))
            except ExpiredSignatureError:
                raise HTTPException(status_code=401, detail="Token expired.")
            except InvalidTokenError:
                raise HTTPException(status_code=401, detail="Invalid token.")
        if user_id:
            specialist = db.query(crud.models.Specialist).filter_by(user_id=user_id).first()
            if not specialist:
                raise HTTPException(status_code=400, detail="Specialist not found for user.")
            correct_specialist_id = specialist.specialist_id
        else:
            raise HTTPException(status_code=400, detail="No valid token provided.")
        # Create a new FeedbackCreate with the correct specialist_id
        feedback_data = feedback.dict()
        feedback_data["specialist_id"] = correct_specialist_id
        new_feedback = schemas.FeedbackCreate(**feedback_data)
        db_feedback = crud.create_feedback(db, new_feedback)
        # Send email notification to patient
        from backend.utils_email import send_email_alert
        patient = db.query(crud.models.Patient).filter_by(patient_id=feedback.patient_id).first()
        if patient and patient.user and patient.user.email:
            subject = "New Feedback from Your Specialist"
            body = f"You have received new feedback from your specialist: <br><br> <b>Comment:</b> {feedback.comments}"
            send_email_alert(patient.user.email, subject, body)
        return db_feedback
    except Exception as e:
        print(f"Error in create_feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback.")

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
