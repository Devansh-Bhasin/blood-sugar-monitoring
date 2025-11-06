def send_email_alert(to_email, subject, body, smtp_server='smtp.example.com', smtp_port=587, username='', password=''):
    msg = MIMEMultipart()
    msg['From'] = username
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        if username and password:
            server.login(username, password)
        server.sendmail(username, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False

def send_email(to_email, subject, body):
    # Use Gmail SMTP config from auth.py
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    username = 'bloodsugarmonitor0@gmail.com'
    password = 'udwnoqsqnssjcify'
    return send_email_alert(to_email, subject, body, smtp_server, smtp_port, username, password)

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_alert(to_email, subject, body, smtp_server='smtp.example.com', smtp_port=587, username='', password=''):
    msg = MIMEMultipart()
    msg['From'] = username
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        if username and password:
            server.login(username, password)
        server.sendmail(username, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False
