
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend import models, database, schemas

router = APIRouter(prefix="/specialist_patient", tags=["specialist_patient"])

# Dependency

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/assign")
def assign_patient_to_specialist(data: schemas.SpecialistPatientAssign = Body(...), db: Session = Depends(get_db)):
    import datetime
    specialist_id = data.specialist_id
    patient_id = data.patient_id
    assigned_by = data.assigned_by if hasattr(data, 'assigned_by') else None
    errors = []
    # Validate specialist
    specialist = db.query(models.Specialist).filter_by(specialist_id=specialist_id).first()
    if not specialist:
        errors.append(f"Specialist ID {specialist_id} does not exist.")
    # Validate patient
    patient = db.query(models.Patient).filter_by(patient_id=patient_id).first()
    if not patient:
        errors.append(f"Patient ID {patient_id} does not exist.")
    # Validate staff
    staff = db.query(models.ClinicStaff).filter_by(staff_id=assigned_by).first() if assigned_by else None
    if assigned_by and not staff:
        errors.append(f"Staff ID {assigned_by} does not exist.")
    existing = db.query(models.SpecialistPatient).filter_by(patient_id=patient_id).first()
    if existing:
        # If already assigned to the same specialist, update assignment metadata
        if existing.specialist_id == specialist_id:
            existing.assigned_by = assigned_by
            existing.assigned_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(existing)
            # Send email notification to specialist and patient
            if specialist and specialist.user and patient and patient.user:
                from backend.utils_email import send_email
                subject = "Patient Assignment Updated"
                body_spec = f"Patient {patient.user.full_name} (ID: {patient_id}) assignment updated by staff member {staff.user.full_name if staff else 'Unknown'} at {existing.assigned_at}."
                body_pat = f"You have been assigned to specialist {specialist.user.full_name} (ID: {specialist_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {existing.assigned_at}."
                try:
                    send_email(specialist.user.email, subject, body_spec)
                    send_email(patient.user.email, subject, body_pat)
                except Exception as e:
                    print(f"Assignment email send failed: {e}")
            return {"detail": "Patient assignment updated."}
        else:
            # Remove previous assignment before creating new one
            db.delete(existing)
            db.commit()
            assignment = models.SpecialistPatient(
                specialist_id=specialist_id,
                patient_id=patient_id,
                assigned_by=assigned_by,
                assigned_at=datetime.datetime.utcnow()
            )
            db.add(assignment)
            db.commit()
            db.refresh(assignment)
            # Send email notification to specialist and patient
            if specialist and specialist.user and patient and patient.user:
                from backend.utils_email import send_email
                subject = "New Patient Assignment"
                body_spec = f"You have been assigned a new patient: {patient.user.full_name} (ID: {patient_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
                body_pat = f"You have been assigned to specialist {specialist.user.full_name} (ID: {specialist_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
                try:
                    send_email(specialist.user.email, subject, body_spec)
                    send_email(patient.user.email, subject, body_pat)
                except Exception as e:
                    print(f"Assignment email send failed: {e}")
            return {"detail": "Patient assigned to specialist."}
    # Count current assignments for the specialist
    count = db.query(models.SpecialistPatient).filter_by(specialist_id=specialist_id).count()
    if count >= 10:
        errors.append("Specialist already has 10 patients.")
    if errors:
        raise HTTPException(status_code=400, detail=errors)
    assignment = models.SpecialistPatient(
        specialist_id=specialist_id,
        patient_id=patient_id,
        assigned_by=assigned_by,
        assigned_at=datetime.datetime.utcnow()
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    # Send email notification to specialist and patient
    if specialist and specialist.user and patient and patient.user:
        from backend.utils_email import send_email
        subject = "New Patient Assignment"
        body_spec = f"You have been assigned a new patient: {patient.user.full_name} (ID: {patient_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
        body_pat = f"You have been assigned to specialist {specialist.user.full_name} (ID: {specialist_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
        try:
            send_email(specialist.user.email, subject, body_spec)
            send_email(patient.user.email, subject, body_pat)
        except Exception as e:
            print(f"Assignment email send failed: {e}")
            db.refresh(assignment)
            # Send email notification to specialist and patient
            if specialist and specialist.user and patient and patient.user:
                from backend.utils_email import send_email
                subject = "New Patient Assignment"
                body_spec = f"You have been assigned a new patient: {patient.user.full_name} (ID: {patient_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
                body_pat = f"You have been assigned to specialist {specialist.user.full_name} (ID: {specialist_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
                send_email(specialist.user.email, subject, body_spec)
                send_email(patient.user.email, subject, body_pat)
            return {"detail": "Patient assigned to specialist."}
    # Count current assignments for the specialist
    count = db.query(models.SpecialistPatient).filter_by(specialist_id=specialist_id).count()
    if count >= 10:
        errors.append("Specialist already has 10 patients.")
    if errors:
        raise HTTPException(status_code=400, detail=errors)
    assignment = models.SpecialistPatient(
        specialist_id=specialist_id,
        patient_id=patient_id,
        assigned_by=assigned_by,
        assigned_at=datetime.datetime.utcnow()
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    # Send email notification to specialist and patient
    if specialist and specialist.user and patient and patient.user:
        from backend.utils_email import send_email
        subject = "New Patient Assignment"
        body_spec = f"You have been assigned a new patient: {patient.user.full_name} (ID: {patient_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
        body_pat = f"You have been assigned to specialist {specialist.user.full_name} (ID: {specialist_id}) by staff member {staff.user.full_name if staff else 'Unknown'} at {assignment.assigned_at}."
        send_email(specialist.user.email, subject, body_spec)
        send_email(patient.user.email, subject, body_pat)
    return {"detail": "Patient assigned to specialist."}

@router.post("/unassign")
def unassign_patient_from_specialist(data: schemas.SpecialistPatientAssign = Body(...), db: Session = Depends(get_db)):
    specialist_id = data.specialist_id
    patient_id = data.patient_id
    assignment = db.query(models.SpecialistPatient).filter_by(specialist_id=specialist_id, patient_id=patient_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    db.delete(assignment)
    db.commit()
    return {"detail": "Patient unassigned from specialist."}

@router.get("/specialist/{specialist_id}")
def get_patients_for_specialist(specialist_id: int, db: Session = Depends(get_db)):
    assignments = db.query(models.SpecialistPatient).filter_by(specialist_id=specialist_id).all()
    return [{"specialist_id": a.specialist_id, "patient_id": a.patient_id} for a in assignments]

@router.get("/patient/{patient_id}")
def get_specialists_for_patient(patient_id: int, db: Session = Depends(get_db)):
    assignments = db.query(models.SpecialistPatient).filter_by(patient_id=patient_id).all()
    return [
        {
            "specialist_id": a.specialist_id,
            "patient_id": a.patient_id,
            "assigned_by": a.assigned_by,
            "assigned_at": a.assigned_at
        }
        for a in assignments
    ]
