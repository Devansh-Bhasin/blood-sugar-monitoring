
from sqlalchemy.orm import Session
from . import models, schemas
import datetime
from sqlalchemy import func

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
    import datetime
    ts = getattr(reading, "timestamp", None)
    if ts is None:
        ts = datetime.datetime.utcnow()
    db_reading = models.Reading(
        patient_id=reading.patient_id,
        value=reading.value,
        unit=reading.unit,
        category=reading.category,
        food_intake=reading.food_intake,
        activities=reading.activities,
        notes=reading.notes,
        timestamp=ts
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


# --- Admin summary / stats ---
def get_admin_summary(db: Session):
    total_users = db.query(models.User).count()
    total_patients = db.query(models.Patient).count()
    total_specialists = db.query(models.Specialist).count()
    total_readings = db.query(models.Reading).count()
    
    # Calculate average glucose with unit normalization (convert all to mmol/L)
    readings = db.query(models.Reading.value, models.Reading.unit).all()
    normalized_values = []
    for val, unit in readings:
        try:
            v = float(val)
            u = (unit or '').lower()
            # Convert mg/dL to mmol/L
            if u in ('mg/dl', 'mg_dl', 'mg_dl') or 'mg' in u:
                v = v / 18.0
            normalized_values.append(v)
        except Exception:
            continue
    avg_glucose = (sum(normalized_values) / len(normalized_values)) if normalized_values else 0
    
    alerts_count = db.query(models.Alert).count()
    reports_count = db.query(models.Report).count()

    # Count patients whose average reading is above their configured max_normal (if threshold exists)
    avg_by_patient = db.query(
        models.Reading.patient_id.label('patient_id'),
        func.avg(models.Reading.value).label('avg_val')
    ).group_by(models.Reading.patient_id).subquery()

    uncontrolled_patients_query = db.query(func.count()).select_from(models.Threshold).join(
        avg_by_patient,
        models.Threshold.patient_id == avg_by_patient.c.patient_id
    ).filter(avg_by_patient.c.avg_val > models.Threshold.max_normal)

    try:
        uncontrolled_patients = int(uncontrolled_patients_query.scalar() or 0)
    except Exception:
        uncontrolled_patients = 0

    return {
        'total_users': total_users,
        'total_patients': total_patients,
        'total_specialists': total_specialists,
        'total_readings': total_readings,
        'average_glucose': float(avg_glucose),
        'alerts_count': alerts_count,
        'reports_count': reports_count,
        'uncontrolled_patients': uncontrolled_patients
    }


def get_readings_daily_averages(db: Session, days: int = 30):
    """
    Return a list of {'date': 'YYYY-MM-DD', 'avg': float} for the last `days` days.
    Normalizes readings to mmol/L (if needed) then averages per-day.
    Returns averages in mmol/L.
    """
    try:
        now = datetime.datetime.utcnow()
        start = now - datetime.timedelta(days=days - 1)
        # load readings in window and group by date after normalizing units to mmol/L
        rows = db.query(models.Reading.timestamp, models.Reading.value, models.Reading.unit).filter(models.Reading.timestamp >= start).all()
        per_day = {}
        for ts, val, unit in rows:
            try:
                v = float(val)
            except Exception:
                continue
            u = (unit or '').lower()
            # normalize to mmol/L
            if u in ('mg/dl', 'mg_dl', 'mg_dl') or 'mg' in u:
                v = v / 18.0
            # otherwise assume mmol/L already
            # compute date string
            try:
                d = ts.date().isoformat()
            except Exception:
                # fallback: try string parsing
                try:
                    d = str(ts)[:10]
                except Exception:
                    continue
            per_day.setdefault(d, []).append(v)

        out = []
        for i in range(days):
            d = (start + datetime.timedelta(days=i)).date().isoformat()
            vals = per_day.get(d, [])
            avg = (sum(vals) / len(vals)) if vals else 0.0
            out.append({'date': d, 'avg': float(avg)})
        return out
    except Exception:
        return []


def get_uncontrolled_patients(db: Session, days: int = 30):
    """
    Return patients whose average reading over the last `days` days exceeds
    their configured max_normal threshold if present, otherwise compare to
    sensible defaults based on the patient's preferred unit.
    Returns list of dicts: {patient_id, avg, preferred_unit, threshold}
    """
    now = datetime.datetime.utcnow()
    start = now - datetime.timedelta(days=days - 1)

    results = []
    # iterate patients who have readings in window
    patients_with_readings = db.query(models.Patient).join(models.Reading).filter(models.Reading.timestamp >= start).all()
    for p in patients_with_readings:
        pid = p.patient_id
        # load readings for the patient in the window
        readings = db.query(models.Reading).filter(models.Reading.patient_id == pid).filter(models.Reading.timestamp >= start).all()
        if not readings:
            continue
        # convert readings to patient's preferred unit
        unit_pref = (p.preferred_unit or 'mmol_L')
        vals = []
        for r in readings:
            try:
                val = float(r.value)
            except Exception:
                continue
            # convert if reading unit is mg_dL and preferred is mmol_L
            if r.unit == 'mg_dL' and unit_pref == 'mmol_L':
                val = val / 18.0
            # convert if reading unit is mmol_L and preferred is mg_dL
            if r.unit == 'mmol_L' and unit_pref == 'mg_dL':
                val = val * 18.0
            vals.append(val)
        if not vals:
            continue
        avg = sum(vals) / len(vals)

        # try to read threshold for this patient if DB supports it
        threshold_max = None
        try:
            th = db.query(models.Threshold).filter(models.Threshold.patient_id == pid).first()
            if th:
                threshold_max = float(th.max_normal)
        except Exception:
            threshold_max = None

        # fallback defaults by unit_pref
        if threshold_max is None:
            if unit_pref == 'mg_dL':
                threshold_max = 140.0
            else:
                threshold_max = 7.8

        # If threshold appears to be in the other unit (heuristic), convert to unit_pref
        try:
            if unit_pref == 'mmol_L' and threshold_max is not None and threshold_max > 50:
                # likely stored as mg/dL, convert
                threshold_max = threshold_max / 18.0
            if unit_pref == 'mg_dL' and threshold_max is not None and threshold_max < 50:
                # likely stored as mmol/L, convert
                threshold_max = threshold_max * 18.0
        except Exception:
            pass

        if avg > threshold_max:
            # fetch user details
            user = db.query(models.User).filter(models.User.user_id == pid).first()
            results.append({
                'patient_id': pid,
                'full_name': user.full_name if user else None,
                'email': user.email if user else None,
                'preferred_unit': unit_pref,
                'avg': avg,
                'threshold': threshold_max
            })

    return results
