from fastapi.responses import Response
# Explicit OPTIONS handler for /auth/login to ensure CORS preflight always succeeds

# Explicit OPTIONS handler for /auth/login (must be after app is defined)
@app.options("/auth/login")
def options_auth_login():
    return Response(status_code=204)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import Base, engine
from backend.routers import patients, readings, specialists, auth, users, clinic_staff, feedback, thresholds, alerts, reports, specialist_patient

Base.metadata.create_all(bind=engine)



app = FastAPI(title="Online Blood Sugar Monitoring System")

# CORS middleware must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://devansh-bhasin.github.io"],  # Only allow GitHub Pages frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(patients.router)
app.include_router(specialists.router)
app.include_router(clinic_staff.router)
app.include_router(readings.router)
app.include_router(feedback.router)
app.include_router(thresholds.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(auth.router)
app.include_router(specialist_patient.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Blood Sugar Monitoring System"}


