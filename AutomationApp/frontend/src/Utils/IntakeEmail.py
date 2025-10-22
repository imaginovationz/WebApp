# components/src/Utils/IntakeEmail.py

import os
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr

def _smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST"),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER"),
        "password": os.environ.get("SMTP_PASS"),
        "from_addr": os.environ.get("SMTP_FROM"),
        "from_name": os.environ.get("SMTP_FROM_NAME", "QE Automation"),
        "use_tls": os.environ.get("SMTP_USE_TLS", "true").lower() != "false",
    }

def send_intake_email(to_email: str, subject: str, html_body: str):
    cfg = _smtp_config()
    missing = [k for k,v in cfg.items() if v in (None, "",) and k in ("host","user","password","from_addr")]
    if missing:
        return (False, f"SMTP not configured (missing: {', '.join(missing)})")

    msg = MIMEText(html_body or "", "html", "utf-8")
    msg["Subject"] = subject or "New Estimate Assigned"
    msg["From"] = formataddr((cfg["from_name"], cfg["from_addr"]))
    msg["To"] = to_email

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=20) as s:
            if cfg["use_tls"]:
                s.starttls()
            s.login(cfg["user"], cfg["password"])
            s.sendmail(cfg["from_addr"], [to_email], msg.as_string())
        return (True, f"sent to {to_email}")
    except Exception as e:
        return (False, str(e))
