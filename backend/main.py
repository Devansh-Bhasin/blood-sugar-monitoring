
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# CORS middleware must be added before anything else
app = FastAPI(title="Online Blood Sugar Monitoring System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://devansh-bhasin.github.io"],
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
    response.headers["Access-Control-Allow-Origin"] = "https://devansh-bhasin.github.io"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

api_prefix = "/api"
app.include_router(users.router, prefix=api_prefix)
app.include_router(patients.router, prefix=api_prefix)
app.include_router(specialists.router, prefix=api_prefix)
app.include_router(clinic_staff.router, prefix=api_prefix)
app.include_router(readings.router, prefix=api_prefix)
app.include_router(feedback.router, prefix=api_prefix)
app.include_router(thresholds.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(specialist_patient.router, prefix=api_prefix)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Blood Sugar Monitoring System"}


