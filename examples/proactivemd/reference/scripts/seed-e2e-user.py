"""Seed Playwright E2E superuser via: manage.py shell < seed-e2e-user.py

Reads qa-automation/src/fixtures/e2e-user.json from /tmp/e2e-user.json in the
API container (copied in CI before this script runs). Falls back to E2E_USER_JSON
when the file is not present.
"""

import json
import os
from pathlib import Path

from authentication.models import CustomUser

fixture_path = Path(os.environ.get("E2E_USER_FIXTURE_PATH", "/tmp/e2e-user.json"))

if fixture_path.is_file():
    payload = json.loads(fixture_path.read_text(encoding="utf-8"))
else:
    payload = json.loads(os.environ["E2E_USER_JSON"])

email = payload["email"].strip()
password = payload["password"]
first_name = payload.get("firstName", "Playwright")
last_name = payload.get("lastName", "E2E")
is_com = bool(payload.get("isCom", True))
is_ccm = bool(payload.get("isCcm", True))
is_rd = bool(payload.get("isRd", True))

user, created = CustomUser.objects.get_or_create(
    email=email,
    defaults={
        "first_name": first_name,
        "last_name": last_name,
        "is_active": True,
        "is_staff": True,
        "is_superuser": True,
        "is_deleted": False,
        "first_time_login": False,
        "is_com": is_com,
        "is_ccm": is_ccm,
        "is_rd": is_rd,
    },
)

user.first_name = first_name
user.last_name = last_name
user.is_active = True
user.is_staff = True
user.is_superuser = True
user.is_deleted = False
user.first_time_login = False
user.is_com = is_com
user.is_ccm = is_ccm
user.is_rd = is_rd
user.set_password(password)
user.save()

user.rbac_roles.clear()

verb = "Created" if created else "Updated"
print(f"{verb} E2E user: {email}")
