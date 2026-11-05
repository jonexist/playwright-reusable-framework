"""TEMPLATE — seed the E2E login user into a Django backend.

Run inside the API container after the stack is healthy:

    docker compose -f docker/docker-compose.e2e.ci.yml cp fixtures/e2e-user.json api:/tmp/e2e-user.json
    docker compose -f docker/docker-compose.e2e.ci.yml exec -T api \\
        python manage.py shell < docker/seed/seed-django-user.py

Derived from ProactiveMD's `seed-e2e-user.py`. Adapt the model import and the
flag names to your user model. Key ideas worth keeping:

* QA owns this file (it lives in the test repo) so seeding needs no backend
  merge. It talks to the app through the shell, not through an API that
  self-registration would gate behind admin approval.
* Idempotent: get_or_create, then re-apply every flag, so reruns and local
  databases converge on the same state.
* Clear anything that would change the landing page or sidebar: forced
  password change on first login, RBAC roles for a "full access" superuser.
* The email/password MUST equal TEST_USER_EMAIL / TEST_USER_PASSWORD (repo
  secrets in CI, `.env` locally).
"""

import json
import os
from pathlib import Path

from django.contrib.auth import get_user_model  # replace with your user model

User = get_user_model()

fixture_path = Path(os.environ.get("E2E_USER_FIXTURE_PATH", "/tmp/e2e-user.json"))
payload = json.loads(
    fixture_path.read_text(encoding="utf-8")
    if fixture_path.is_file()
    else os.environ["E2E_USER_JSON"]
)

email = payload["email"].strip()

user, created = User.objects.get_or_create(
    email=email,
    defaults={"is_active": True, "is_staff": True, "is_superuser": True},
)

user.first_name = payload.get("firstName", "Playwright")
user.last_name = payload.get("lastName", "E2E")
user.is_active = True
user.is_staff = True
user.is_superuser = True
# user.first_time_login = False   # avoids the forced /change-password redirect
user.set_password(payload["password"])
user.save()
# user.rbac_roles.clear()          # unscoped superuser -> full sidebar

print(f"{'Created' if created else 'Updated'} E2E user: {email}")
