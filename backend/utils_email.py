
import os
import requests

MAILJET_API_KEY = os.getenv("MAILJET_API_KEY", "0bec382ee859232ed41b14faa8980e0e")
MAILJET_API_SECRET = os.getenv("MAILJET_API_SECRET", "79988653b13c5803bf98b838344eff13")
MAILJET_FROM_EMAIL = os.getenv("MAILJET_FROM_EMAIL", "your-verified@mailjet.email")  # Replace with your verified sender

def send_email_alert(to_email, subject, body, *args, **kwargs):
    url = "https://api.mailjet.com/v3.1/send"
    data = {
        "Messages": [
            {
                "From": {"Email": MAILJET_FROM_EMAIL, "Name": "Blood Sugar Monitor"},
                "To": [{"Email": to_email}],
                "Subject": subject,
                "HTMLPart": body
            }
        ]
    }
    response = requests.post(
        url,
        auth=(MAILJET_API_KEY, MAILJET_API_SECRET),
        json=data
    )
    if response.status_code == 200:
        print(f"Mailjet email sent to {to_email}")
        return True
    else:
        print(f"Mailjet email failed: {response.status_code} {response.text}")
        return False
