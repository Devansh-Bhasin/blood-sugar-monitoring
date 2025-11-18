
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# CORS middleware must be added before anything else
app = FastAPI(title="Online Blood Sugar Monitoring System")

# Allow common dev origins and Codespaces preview URLs. For local development
# it's convenient to allow localhost and Codespaces forwarded hosts. In
# production you should restrict this to your actual frontend host(s).
DEFAULT_ALLOWED = [
    "https://devansh-bhasin.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
    # Common Codespaces/preview hosts you may encounter during development
    "https://sturdy-tribble-wrq67wqrqq9rhg66-5173.app.github.dev",
    "https://sturdy-tribble-wrq67wqrqq9rhg66-8000.app.github.dev",
]

# If you need to allow all origins for quick dev testing (not recommended for
# production), set environment variable `DEV_ALLOW_ALL_ORIGINS=1` in the
# environment where the backend runs. By default we allow the common dev
# origins above.
if os.getenv("DEV_ALLOW_ALL_ORIGINS", "1") == "1":
    allow_origins = ["*"]
else:
    # You can add Codespaces/Codespaces-preview forwarded URLs here when needed.
    allow_origins = DEFAULT_ALLOWED

# If we allow all origins ("*"), browsers will reject Access-Control-Allow-Credentials
# together with a wildcard origin. Disable credentials in that case to avoid CORS
# failures during local development. In production, set `DEV_ALLOW_ALL_ORIGINS=0`
# and configure explicit origins and credentials as needed.
allow_credentials = True
if allow_origins == ["*"]:
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


from backend.database import Base, engine
from backend.routers import patients, readings, specialists, auth, users, clinic_staff, feedback, thresholds, alerts, reports, specialist_patient, appointments, admin

from fastapi.responses import Response
@app.options("/auth/login")
def options_auth_login():
    return Response(status_code=204)


from fastapi.requests import Request


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
app.include_router(appointments.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)

# Serve the production-built frontend when available. This lets you open the
# application from the backend preview (port 8000) without authorizing a
# separate Codespaces forwarded port for Vite during development. The
# frontend build output path is `../frontend/frontend/dist` relative to this
# file. If the folder doesn't exist yet, FastAPI will still start normally.
from fastapi.staticfiles import StaticFiles

dist_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "frontend", "dist")
if os.path.isdir(dist_path):
    # Mount at /app for index.html and at /blood-sugar-monitoring/assets for assets
    app.mount("/app", StaticFiles(directory=dist_path, html=True), name="frontend")
    app.mount("/blood-sugar-monitoring/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="frontend_assets")


@app.get("/")
def read_root():
    # Fallback JSON for when the frontend dist is not present
    return {"message": "Welcome to the Blood Sugar Monitoring System"}


# Debug endpoint to list all registered routes
@app.get("/api/debug/routes")
def list_routes():
        routes = []
        for route in app.routes:
                methods = ",".join(route.methods) if getattr(route, "methods", None) else ""
                routes.append(f"{route.path} [{methods}]")
        return {"routes": routes}


