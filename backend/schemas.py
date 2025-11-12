# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    patient_id: int
    staff_id: int
    start_time: datetime.datetime
    end_time: datetime.datetime
    reason: str = None
    notes: str = None
    status: str = "scheduled"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    start_time: datetime.datetime = None
    end_time: datetime.datetime = None
    reason: str = None
    notes: str = None
    status: str = None

class Appointment(AppointmentBase):
    appointment_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    class Config:
        orm_mode = True



# --- Specialist-Patient Assignment Schema ---

from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

class SpecialistPatientAssign(BaseModel):
    specialist_id: Optional[int] = None
    patient_id: Optional[int] = None
    assigned_by: Optional[int] = None

from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str

class User(UserBase):
    user_id: int
    role: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    class Config:
        orm_mode = True        
# --- Patient Schemas ---
class PatientBase(BaseModel):
    health_care_number: str
    date_of_birth: Optional[datetime.date] = None
    preferred_unit: str = "mmol_L"

class PatientCreate(PatientBase):
    user: UserCreate

class Patient(PatientBase):
    patient_id: int
    user: User
    readings: List['Reading'] = []
    feedback: List['Feedback'] = []
    alerts: List['Alert'] = []
    class Config:
        orm_mode = True

# --- Specialist Schemas ---
class SpecialistBase(BaseModel):
    specialist_code: Optional[str] = None

class SpecialistCreate(SpecialistBase):
    user: UserCreate
    user_id: Optional[int] = None

class Specialist(SpecialistBase):
    specialist_id: int
    user_id: int
    user: User
    feedback: List['Feedback'] = []
    alerts: List['Alert'] = []
    class Config:
        orm_mode = True

# --- Clinic Staff Schemas ---
class ClinicStaffCreate(BaseModel):
    user: UserCreate

class ClinicStaff(BaseModel):
    staff_id: int
    user: User
    thresholds: List['Threshold'] = []
    class Config:
        orm_mode = True

# --- Reading Schemas ---
class ReadingBase(BaseModel):
    value: float
    unit: str
    category: Optional[str] = None
    food_intake: Optional[str] = None
    activities: Optional[str] = None
    event: Optional[str] = None
    symptom: Optional[str] = None
    notes: Optional[str] = None
# --- AI Insight Schemas ---
class AIInsightBase(BaseModel):
    patient_id: int
    specialist_id: Optional[int] = None
    trigger_type: str
    trigger_value: str
    abnormal_count: int
    suggestion: Optional[str] = None

class AIInsightCreate(AIInsightBase):
    pass

class AIInsight(AIInsightBase):
    insight_id: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class ReadingCreate(ReadingBase):
    patient_id: int

class Reading(ReadingBase):
    reading_id: int
    patient_id: int
    timestamp: datetime.datetime
    created_at: datetime.datetime
    class Config:
        orm_mode = True

# --- Feedback Schemas ---
class FeedbackBase(BaseModel):
    specialist_id: int
    patient_id: int
    reading_id: Optional[int] = None
    comments: str

class FeedbackCreate(FeedbackBase):
    pass

class Feedback(FeedbackBase):
    feedback_id: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

# --- Threshold Schemas ---
class ThresholdBase(BaseModel):
    patient_id: int
    min_normal: float
    max_normal: float
    max_borderline: float
    configured_by: Optional[int] = None

class ThresholdCreate(ThresholdBase):
    pass

class Threshold(ThresholdBase):
    threshold_id: int
    updated_at: datetime.datetime
    class Config:
        orm_mode = True

# --- Alert Schemas ---
class AlertBase(BaseModel):
    patient_id: int
    specialist_id: Optional[int] = None
    window_start: datetime.datetime
    window_end: datetime.datetime
    abnormal_count: int
    status: str

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    alert_id: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

# --- Report Schemas ---
class ReportBase(BaseModel):
    admin_id: int
    period: str
    period_start: datetime.date
    period_end: datetime.date
    patient_statistics: str  # JSON string
    trigger_summary: Optional[str] = None  # JSON string

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    report_id: int
    generated_at: datetime.datetime
    class Config:
        orm_mode = True

# --- Password & Forgot Password Schemas ---
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordVerify(BaseModel):
    email: EmailStr
    code: str

class ForgotPasswordReset(BaseModel):
    email: EmailStr
    code: str
    new_password: str
