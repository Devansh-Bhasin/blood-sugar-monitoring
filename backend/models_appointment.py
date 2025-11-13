from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Text
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Appointment(Base):
    __tablename__ = "appointments"
    appointment_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("clinic_staff.staff_id"), nullable=False)
    specialist_id = Column(Integer, ForeignKey("specialists.specialist_id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    reason = Column(String(255))
    notes = Column(Text)
    status = Column(String(32), default="scheduled")  # scheduled, completed, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    patient = relationship("Patient")
    staff = relationship("ClinicStaff")
    specialist = relationship("Specialist")
