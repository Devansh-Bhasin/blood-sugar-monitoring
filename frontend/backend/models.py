
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Table, Text, Numeric, Boolean
from sqlalchemy.orm import relationship
from .models_specialist_patient import SpecialistPatient
from .database import Base
import datetime

# --- Users Table ---
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(254), unique=True, nullable=False)
    password_hash = Column(String(60), nullable=False)
    role = Column(String(16), nullable=False)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(25))
    profile_image = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

# --- Patients Table ---
class Patient(Base):
    __tablename__ = "patients"
    patient_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    health_care_number = Column(String(64), unique=True)
    date_of_birth = Column(DateTime)
    preferred_unit = Column(String(8), nullable=False, default="mmol_L")
    user = relationship("User")
    readings = relationship("Reading", back_populates="patient")
    feedback = relationship("Feedback", back_populates="patient")
    alerts = relationship("Alert", back_populates="patient")

# --- Specialists Table ---
class Specialist(Base):
    __tablename__ = "specialists"
    specialist_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    specialist_code = Column(String(64))
    user = relationship("User")
    feedback = relationship("Feedback", back_populates="specialist")
    alerts = relationship("Alert", back_populates="specialist")
# Import SpecialistPatient and set relationships after all models are defined
from .models_specialist_patient import SpecialistPatient
Patient.assigned_specialists = relationship("SpecialistPatient", back_populates="patient")
Specialist.assigned_patients = relationship("SpecialistPatient", back_populates="specialist")

# --- Clinic Staff Table ---
class ClinicStaff(Base):
    __tablename__ = "clinic_staff"
    staff_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    user = relationship("User")
    thresholds = relationship("Threshold", back_populates="staff")

# --- Readings Table ---
class Reading(Base):
    __tablename__ = "readings"
    reading_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    value = Column(Numeric(6,2), nullable=False)
    unit = Column(String(8), nullable=False)
    category = Column(String(12), nullable=False)
    food_intake = Column(String(255))
    activities = Column(String(255))
    event = Column(String(255))
    symptom = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    patient = relationship("Patient", back_populates="readings")
# --- AI Insight Table ---
class AIInsight(Base):
    __tablename__ = "ai_insights"
    insight_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    specialist_id = Column(Integer, ForeignKey("specialists.specialist_id"))
    trigger_type = Column(String(32), nullable=False)  # food, activity, event, symptom
    trigger_value = Column(String(255), nullable=False)
    abnormal_count = Column(Integer, nullable=False)
    suggestion = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# --- Feedback Table ---
class Feedback(Base):
    __tablename__ = "feedback"
    feedback_id = Column(Integer, primary_key=True, index=True)
    specialist_id = Column(Integer, ForeignKey("specialists.specialist_id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    reading_id = Column(Integer, ForeignKey("readings.reading_id"))
    comments = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    specialist = relationship("Specialist", back_populates="feedback")
    patient = relationship("Patient", back_populates="feedback")
    reading = relationship("Reading")

# --- Thresholds Table ---
class Threshold(Base):
    __tablename__ = "thresholds"
    threshold_id = Column(Integer, primary_key=True, index=True)
    min_normal = Column(Numeric(6,2), nullable=False)
    max_normal = Column(Numeric(6,2), nullable=False)
    max_borderline = Column(Numeric(6,2), nullable=False)
    configured_by = Column(Integer, ForeignKey("clinic_staff.staff_id"))
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    staff = relationship("ClinicStaff", back_populates="thresholds")

# --- Alerts Table ---
class Alert(Base):
    __tablename__ = "alerts"
    alert_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    specialist_id = Column(Integer, ForeignKey("specialists.specialist_id"))
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    abnormal_count = Column(Integer, nullable=False)
    status = Column(String(8), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    patient = relationship("Patient", back_populates="alerts")
    specialist = relationship("Specialist", back_populates="alerts")

# --- Reports Table ---
class Report(Base):
    __tablename__ = "reports"
    report_id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.user_id"))
    period = Column(String(8), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    patient_statistics = Column(Text, nullable=False)  # Use JSON string for simplicity
    trigger_summary = Column(Text)  # Use JSON string for simplicity
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
