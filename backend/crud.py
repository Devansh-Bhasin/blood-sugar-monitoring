
from sqlalchemy.orm import Session
from . import models, schemas
import datetime

# --- User CRUD ---
def create_user(db: Session, user: schemas.UserCreate):
    import bcrypt
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    db_user = models.User(
        email=user.email,
        password_hash=hashed.decode('utf-8'),
        role=user.role,
        full_name=user.full_name,
        phone=user.phone,
        profile_image=user.profile_image
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# --- Patient CRUD ---
def create_patient(db: Session, patient: schemas.PatientCreate):
    db_user = create_user(db, patient.user)
    db_patient = models.Patient(
        patient_id=db_user.user_id,
        health_care_number=patient.health_care_number,
        date_of_birth=patient.date_of_birth,
        preferred_unit=patient.preferred_unit
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patients(db: Session):
    return db.query(models.Patient).all()

# --- Specialist CRUD ---
def create_specialist(db: Session, specialist: schemas.SpecialistCreate):
    db_user = create_user(db, specialist.user)
    from fastapi import HTTPException
    existing = db.query(models.Specialist).filter(models.Specialist.user_id == db_user.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Specialist already exists for this user.")
    code = specialist.specialist_code or f"SPC{db_user.user_id:06d}"
    db_specialist = models.Specialist(
        user_id=db_user.user_id,
        specialist_code=code
    )
    db.add(db_specialist)
    db.commit()
    db.refresh(db_specialist)
    return db_specialist

def get_specialists(db: Session):
    return db.query(models.Specialist).all()

# --- Clinic Staff CRUD ---
def create_clinic_staff(db: Session, staff: schemas.ClinicStaffCreate):
    db_user = create_user(db, staff.user)
    db_staff = models.ClinicStaff(staff_id=db_user.user_id)
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

def get_clinic_staff(db: Session):
    return db.query(models.ClinicStaff).all()

# --- Reading CRUD ---
def create_reading(db: Session, reading: schemas.ReadingCreate):
    db_reading = models.Reading(
        patient_id=reading.patient_id,
        value=reading.value,
        unit=reading.unit,
        category=reading.category,
        food_intake=reading.food_intake,
        activities=reading.activities,
        notes=reading.notes,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

def get_readings(db: Session, patient_id: int):
    return db.query(models.Reading).filter(models.Reading.patient_id == patient_id).all()

# --- Feedback CRUD ---
def create_feedback(db: Session, feedback: schemas.FeedbackCreate):
    db_feedback = models.Feedback(
        specialist_id=feedback.specialist_id,
        patient_id=feedback.patient_id,
        reading_id=feedback.reading_id,
        comments=feedback.comments,
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_for_patient(db: Session, patient_id: int):
    return db.query(models.Feedback).filter(models.Feedback.patient_id == patient_id).all()

# --- Threshold CRUD ---
def create_threshold(db: Session, threshold: schemas.ThresholdCreate):
    existing = db.query(models.Threshold).filter(models.Threshold.patient_id == threshold.patient_id).first()
    if existing:
        existing.min_normal = threshold.min_normal
        existing.max_normal = threshold.max_normal
        existing.max_borderline = threshold.max_borderline
        existing.configured_by = threshold.configured_by
        existing.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_threshold = models.Threshold(
            patient_id=threshold.patient_id,
            min_normal=threshold.min_normal,
            max_normal=threshold.max_normal,
            max_borderline=threshold.max_borderline,
            configured_by=threshold.configured_by,
            updated_at=datetime.datetime.utcnow()
        )
        db.add(db_threshold)
        db.commit()
        db.refresh(db_threshold)
        return db_threshold

def get_thresholds(db: Session):
    return db.query(models.Threshold).all()

def get_threshold_for_patient(db: Session, patient_id: int):
    return db.query(models.Threshold).filter(models.Threshold.patient_id == patient_id).first()

# --- Alert CRUD ---
def create_alert(db: Session, alert: schemas.AlertCreate):
    db_alert = models.Alert(
        patient_id=alert.patient_id,
        specialist_id=alert.specialist_id,
        window_start=alert.window_start,
        window_end=alert.window_end,
        abnormal_count=alert.abnormal_count,
        status=alert.status,
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts_for_patient(db: Session, patient_id: int):
    return db.query(models.Alert).filter(models.Alert.patient_id == patient_id).all()

# --- Report CRUD ---
def create_report(db: Session, report: schemas.ReportCreate):
    db_report = models.Report(
        period=report.period,
        period_start=report.period_start,
        period_end=report.period_end,
        patient_statistics=report.patient_statistics,
        trigger_summary=report.trigger_summary,
        generated_at=datetime.datetime.utcnow()
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_reports(db: Session):
    return db.query(models.Report).all()
