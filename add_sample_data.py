import requests

BASE_URL = "http://127.0.0.1:8002"

endpoints = [
    "/patients/sample",
    "/specialists/sample",
    "/clinic_staff/sample",
    "/readings/sample",
    "/feedback/sample",
    "/thresholds/sample",
    "/alerts/sample",
    "/reports/sample"
]

for endpoint in endpoints:
    url = BASE_URL + endpoint
    try:
        resp = requests.post(url)
        print(f"POST {url} -> {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Error posting to {url}: {e}")
