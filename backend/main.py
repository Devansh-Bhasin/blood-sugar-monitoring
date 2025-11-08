
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# CORS middleware must be added before anything else
app = FastAPI(title="Online Blood Sugar Monitoring System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.database import Base, engine
from backend.routers import patients, readings, specialists, auth, users, clinic_staff, feedback, thresholds, alerts, reports, specialist_patient

Base.metadata.create_all(bind=engine)

from fastapi.responses import Response
@app.options("/auth/login")
def options_auth_login():
    return Response(status_code=204)


from fastapi.requests import Request

# Global OPTIONS handler for CORS preflight
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    print(f"OPTIONS preflight for: {rest_of_path}")
    response = Response(status_code=204)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

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


