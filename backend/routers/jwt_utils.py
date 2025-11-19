import jwt
from fastapi import HTTPException
from backend.models import User
from sqlalchemy.orm import Session

JWT_SECRET = "supersecretkey"  # Must match the value in auth.py
JWT_ALGORITHM = "HS256"

def get_user_from_jwt(token: str, db: Session) -> User:
    if not token:
        print("[JWT DEBUG] No token provided")
        raise HTTPException(status_code=401, detail="Unauthorized: No token provided")
    try:
        if token.startswith("Bearer "):
            token = token[len("Bearer ") :]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        print(f"[JWT DEBUG] Decoded JWT payload: {payload}")
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            print(f"[JWT DEBUG] User not found for user_id: {user_id}")
            raise HTTPException(status_code=401, detail="Unauthorized: User not found")
        return user
    except jwt.ExpiredSignatureError:
        print("[JWT DEBUG] Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        print(f"[JWT DEBUG] Invalid token: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
