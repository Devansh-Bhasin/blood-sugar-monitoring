
# Specialist-specific appointments endpoint (must be after router is defined)
@router.get("/specialist/{specialist_id}", response_model=List[schemas.Appointment])
def list_appointments_by_specialist(specialist_id: int, db: Session = Depends(get_db)):
    appts = db.query(models.Appointment).filter(models.Appointment.staff_id == specialist_id).all()
    for a in appts:
        a.patient_name = a.patient.user.full_name if a.patient and a.patient.user else ""
        a.specialist_name = a.staff.user.full_name if a.staff and a.staff.user else ""
    return appts
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from datetime import datetime

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.Appointment])
def list_appointments(specialist_id: int = None, patient_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    q = db.query(models.Appointment)
    if specialist_id:
        q = q.filter(models.Appointment.staff_id == specialist_id)
    if patient_id:
        q = q.filter(models.Appointment.patient_id == patient_id)
    appts = q.offset(skip).limit(limit).all()
    # Attach names for frontend display
    for a in appts:
        a.patient_name = a.patient.user.full_name if a.patient and a.patient.user else ""
        a.specialist_name = a.staff.user.full_name if a.staff and a.staff.user else ""
    return appts

@router.post("/", response_model=schemas.Appointment, status_code=status.HTTP_201_CREATED)
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    db_appointment = models.Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    # Attach names for frontend display
    db_appointment.patient_name = db_appointment.patient.user.full_name if db_appointment.patient and db_appointment.patient.user else ""
    db_appointment.specialist_name = db_appointment.staff.user.full_name if db_appointment.staff and db_appointment.staff.user else ""
    return db_appointment

@router.get("/{appointment_id}", response_model=schemas.Appointment)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.patient_name = appt.patient.user.full_name if appt.patient and appt.patient.user else ""
    appt.specialist_name = appt.staff.user.full_name if appt.staff and appt.staff.user else ""
    return appt

@router.put("/{appointment_id}", response_model=schemas.Appointment)
def update_appointment(appointment_id: int, appointment: schemas.AppointmentUpdate, db: Session = Depends(get_db)):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for key, value in appointment.dict(exclude_unset=True).items():
        setattr(db_appointment, key, value)
    db.commit()
    db.refresh(db_appointment)
    db_appointment.patient_name = db_appointment.patient.user.full_name if db_appointment.patient and db_appointment.patient.user else ""
    db_appointment.specialist_name = db_appointment.staff.user.full_name if db_appointment.staff and db_appointment.staff.user else ""
    return db_appointment

@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(db_appointment)
    db.commit()
    return None
