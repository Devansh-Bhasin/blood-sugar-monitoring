import jwt

def get_current_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
        return int(payload.get("sub"))
    except Exception:
        return None
from backend.models import Reading
from collections import Counter

def analyze_readings(readings: list[Reading]):
    """Basic AI analysis: find top activity/food/event triggers for high blood sugar"""
    high_readings = [r for r in readings if r.blood_sugar > 140]
    
    activities = [r.activity for r in high_readings if r.activity]
    events = [r.event for r in high_readings if r.event]
    symptoms = [r.symptom for r in high_readings if r.symptom]
    
    top_activity = Counter(activities).most_common(3)
    top_event = Counter(events).most_common(3)
    top_symptom = Counter(symptoms).most_common(3)
    
    return {
        "top_activity_triggers": top_activity,
        "top_event_triggers": top_event,
        "top_symptom_triggers": top_symptom
    }
