from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class SpecialistPatient(Base):
    __tablename__ = "specialist_patient"
    id = Column(Integer, primary_key=True, autoincrement=True)
    specialist_id = Column(Integer, ForeignKey("specialists.specialist_id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("clinic_staff.staff_id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    __table_args__ = (UniqueConstraint('specialist_id', 'patient_id', name='_specialist_patient_uc'),)

    specialist = relationship("Specialist")
    patient = relationship("Patient")
