from fastapi import APIRouter, HTTPException, Depends
from fastapi import Body
from backend import schemas
import random, string
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    print("LOGIN REQUEST DATA:", data)
    email = data.email
    password = data.password
    user = db.query(models.User).filter(models.User.email == email).first()
    import bcrypt
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    print("LOGIN SUCCESS FOR:", email)
    return {
        "access_token": f"token-{user.user_id}",
        "role": user.role,
        "full_name": user.full_name
    }

# --- Password Change Endpoint ---
@router.post("/change-password")
def change_password(data: schemas.PasswordUpdate, db: Session = Depends(get_db), user_email: str = Body(...)):
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    import bcrypt
    if not bcrypt.checkpw(data.current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Current password incorrect")
    user.password_hash = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.commit()
    return {"message": "Password updated successfully"}

# --- Forgot Password Workflow ---
# In-memory store for codes (replace with Redis/DB for production)
reset_codes = {}

from backend.utils_email import send_email_alert

def send_email(to_email, subject, body):
    # Gmail SMTP configuration with new app password (no spaces)
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    username = 'bloodsugarmonitor0@gmail.com'
    password = 'udwnoqsqnssjcify'
    success = send_email_alert(to_email, subject, body, smtp_server, smtp_port, username, password)
    if not success:
        print(f"Failed to send email to {to_email}")

@router.post("/forgot-password/request")
def forgot_password_request(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    code = ''.join(random.choices(string.digits, k=6))
    reset_codes[data.email] = code
    send_email(data.email, "Password Reset Code", f"Your code is: {code}")
    return {"message": "Reset code sent to email"}

@router.post("/forgot-password/verify")
def forgot_password_verify(data: schemas.ForgotPasswordVerify):
    if reset_codes.get(data.email) != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")
    return {"message": "Code verified"}

@router.post("/forgot-password/reset")
def forgot_password_reset(data: schemas.ForgotPasswordReset, db: Session = Depends(get_db)):
    if reset_codes.get(data.email) != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    import bcrypt
    user.password_hash = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.commit()
    del reset_codes[data.email]
    return {"message": "Password reset successful"}
