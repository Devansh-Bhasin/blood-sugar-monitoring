import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

smtp_server = 'smtp.atomicmail.io'
smtp_port = 587
username = 'bloodmonitor@atomicmail.io'
password = 'blood@123'

to_email = 'devanshbhasin84@gmail.com'  # Change to your test email
subject = 'SMTP Test from Blood Sugar Monitoring'
body = 'This is a test email sent via AtomicMail SMTP.'

msg = MIMEMultipart()
msg['From'] = username
msg['To'] = to_email
msg['Subject'] = subject
msg.attach(MIMEText(body, 'plain'))

try:
    server = smtplib.SMTP(smtp_server, smtp_port)
    server.starttls()
    server.login(username, password)
    server.sendmail(username, to_email, msg.as_string())
    server.quit()
    print('Email sent successfully!')
except Exception as e:
    print(f'Email send failed: {e}')
