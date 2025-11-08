import requests
import os

# Use Resend API for transactional email (https://resend.com/)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@yourdomain.com")

def send_email_alert(to_email, subject, body, *args, **kwargs):
    if not RESEND_API_KEY:
        print("Resend API key not set. Cannot send email.")
        return False
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": f"<pre>{body}</pre>"
            }
        )
        if response.status_code == 200:
            return True
        else:
            print(f"Resend email failed: {response.status_code} {response.text}")
            return False
    except Exception as e:
        print(f"Resend email exception: {e}")
        return False
