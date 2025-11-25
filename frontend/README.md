# Blood Sugar Monitoring

A full-stack blood sugar monitoring system for clinics, built with FastAPI (Python) and React (JavaScript).

## Quick Login Info
- **Admin credentials:**
	- Email: `admin@example.com`
	- Password: `admin123`
- If you have any login problems, please clear your browser cookies and try again.

## Features
- Patient, Specialist, Staff, and Admin roles
- Secure authentication (JWT)
- Blood sugar readings with auto-categorization and alerts
- Specialist-patient assignment with email notifications (Mailjet)
- Dashboards for all roles
- AI-based suggestions and feedback
- Modern responsive UI
- Deployed backend (Heroku) and frontend (GitHub Pages)

## Tech Stack
| Layer     | Language   | Framework/Library      | Platform         |
|-----------|------------|------------------------|------------------|
| Backend   | Python     | FastAPI, SQLAlchemy    | Heroku           |
| Frontend  | JavaScript | React, Vite, Axios     | GitHub Pages     |
| Database  | SQL        | PostgreSQL             | Heroku Postgres  |
| Email     | -          | Mailjet API            | Mailjet          |

## Deployment URLs
- **Backend (Heroku):** https://blood-sugar-monitoring-system-3c4cc007e08e.herokuapp.com/
- **Frontend (GitHub Pages):** https://devansh-bhasin.github.io/blood-sugar-monitoring/

## Setup & Development

### Backend (FastAPI)
1. Install dependencies:
	```bash
	pip install -r requirements.txt
	```
2. Set environment variables (see Heroku config for: `DATABASE_URL`, `MAILJET_API_KEY`, `MAILJET_API_SECRET`, `MAILJET_FROM_EMAIL`)
3. Run locally:
	```bash
	uvicorn backend.main:app --reload
	```
4. Deploy to Heroku:
	```bash
	git push heroku master
	```

### Frontend (React)
1. Install dependencies:
	```bash
	cd frontend
	npm install
	```
2. Run locally:
	```bash
	npm run dev
	```
3. Build & deploy to GitHub Pages:
	```bash
	npm run build && npm run deploy
	```

## Notes
- All API endpoints are prefixed with `/api/`.
- CORS is configured for frontend-backend integration.
- Email notifications use Mailjet (ensure sender is verified).
- See `requirements.txt` and `frontend/package.json` for dependencies.

---
For questions or contributions, open an issue or pull request.
