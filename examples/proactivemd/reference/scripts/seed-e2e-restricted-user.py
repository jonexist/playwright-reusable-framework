"""Seed the Playwright RBAC (non-superuser) user via: manage.py shell < seed-e2e-restricted-user.py

Reads qa-automation/src/fixtures/e2e-restricted-user.json from
/tmp/e2e-restricted-user.json in the API container (copied in CI before this
script runs). Falls back to E2E_RESTRICTED_USER_JSON when the file is not present.

Creates (or resets) one role whose app_permissions come from the fixture, and a
non-superuser assigned only to that role, so RBAC specs see a scoped session.
"""

import json
import os
from pathlib import Path

from authentication.models import CustomUser, Role

fixture_path = Path(
    os.environ.get(
        "E2E_RESTRICTED_USER_FIXTURE_PATH", "/tmp/e2e-restricted-user.json"
    )
)

if fixture_path.is_file():
    payload = json.loads(fixture_path.read_text(encoding="utf-8"))
else:
    payload = json.loads(os.environ["E2E_RESTRICTED_USER_JSON"])

email = payload["email"].strip()
password = payload["password"]
first_name = payload.get("firstName", "Playwright")
last_name = payload.get("lastName", "Restricted")
role_name = payload["roleName"].strip()
permissions = payload["permissions"]

# all_objects: a soft-deleted role with this name would otherwise trip the unique name.
role, _ = Role.all_objects.get_or_create(name=role_name)
role.description = "Playwright RBAC E2E role (seeded; do not edit)."
role.app_permissions = permissions
role.requires_client_assignment = False
role.is_active = True
role.is_deleted = False
role.save()

user, created = CustomUser.objects.get_or_create(
    email=email,
    defaults={
        "first_name": first_name,
        "last_name": last_name,
    },
)

user.first_name = first_name
user.last_name = last_name
user.is_active = True
user.is_staff = False
user.is_superuser = False
user.is_deleted = False
user.is_rejected = False
user.first_time_login = False
user.is_com = False
user.is_ccm = False
user.is_rd = False
user.is_care_navigator = False
user.set_password(password)
user.save()

user.rbac_roles.set([role])

verb = "Created" if created else "Updated"
print(f"{verb} E2E restricted user: {email} (role: {role_name})")
