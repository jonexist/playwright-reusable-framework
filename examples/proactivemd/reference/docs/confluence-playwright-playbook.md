# Playwright E2E in CI — QA Implementation Guide

| | |
|---|---|
| **Audience** | QA engineers, automation leads, frontend/backend devs setting up CI |
| **Reference project** | Proactive IQ (`pmd-platform-ui`) |
| **Pattern name** | Isolated E2E stack on GitHub Actions |
| **Status** | Production (PRs → `develop`) |

---

## 1. Purpose of this document

This guide explains **how we run Playwright E2E tests in CI without depending on staging**, and **how to copy the approach to another project**.

After reading this, a QA engineer should be able to:

- Explain why isolated E2E is used instead of shared environments
- Map the CI pipeline (`typecheck` → unified `playwright`) to their own frontend/backend repos
- Know which files to create and which secrets to configure
- Avoid common pitfalls we hit on Proactive IQ

---

## 2. The problem we solved

| Running against staging | Running isolated stack in CI |
|-------------------------|------------------------------|
| Tests mutate data (register, CRUD) | Fresh DB every run |
| Flaky when staging is down or shared | Self-contained on the runner |
| Needs long-lived test accounts | Seeded user per run |
| Blocks PRs unrelated to your app | Only your PR branch is tested |
| Hard to reproduce locally vs CI | Same compose + seed pattern |

**Rule of thumb:** If E2E tests **create or change data**, do not point CI at a shared environment unless you have dedicated test tenants and cleanup jobs.

---

## 3. Pattern overview (any project)

Every implementation needs **four layers**:

```text
┌─────────────────────────────────────────────────────────────┐
│  Layer 1 — Test code (Playwright)                           │
│    Page objects, specs, fixtures, playwright.config.ts      │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 — Local/CI environment (Docker Compose)            │
│    Database + dependencies + API container                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 — Test data seeding (owned by QA / frontend repo)  │
│    JSON fixture + script run against API after stack is up  │
├─────────────────────────────────────────────────────────────┤
│  Layer 4 — GitHub Actions workflow                          │
│    Build artifacts → start stack → seed → run tests         │
└─────────────────────────────────────────────────────────────┘
```

**Runtime on one GitHub Actions runner:**

```text
Postgres + Redis + API (:8000)  ← Docker (built on same runner)
Next.js prod server (:3000)     ← yarn build on same runner
Playwright                      ← hits localhost only
```

---

## 4. Reference architecture (Proactive IQ)

```text
                    PR to develop (Ready for Review)
                              │
                              ▼
                         typecheck
                              │
                              ▼
                        playwright job
              (parallel Docker build + yarn build)
                    compose up → seed → tests
                              │
                              ▼
                   cleanup-artifacts (success only)
```

**Repositories involved:**

| Repo | Role in CI |
|------|------------|
| `pmd-platform-ui` | Playwright tests, workflow, compose file, seed script |
| `pmd-data-platform-backend` | Checked out read-only; Docker image built in CI |

**Important:** QA does **not** need write access to the backend repo. Seeding lives in the frontend/QA repo and runs via `docker compose exec`.

---

## 5. Standard folder layout (copy this)

Use a dedicated `qa-automation/` folder in the **frontend** repo:

```text
your-frontend-repo/
├── .github/
│   ├── workflows/playwright.yml
│   └── actions/setup-e2e-node/action.yml   # optional but recommended
├── playwright.config.ts
└── qa-automation/
    ├── docker-compose.e2e.ci.yml
    ├── docker/
    │   └── postgres-init.sql              # if API needs multiple DBs
    ├── docs/
    │   ├── ci-setup.md                    # short dev/QA notes
    │   └── confluence-playwright-playbook.md
    ├── src/
    │   ├── fixtures/
    │   │   └── e2e-user.json              # test user definition
    │   ├── scripts/
    │   │   └── seed-e2e-user.py           # or .sh / API calls
    │   ├── auth/                          # global-setup, storage state
    │   ├── config/                        # env, test-data
    │   └── pages/                         # Page Object Model
    └── tests/
        ├── ui/                            # fast UI smoke (no full backend)
        └── e2e/                           # full flows through UI + API
            ├── auth/                      # login, register, navigation
            ├── setup/                     # tenant bootstrap (ordered projects)
            ├── modules/                   # patient / biometric / flu
            ├── public/                    # tier between setup and events (no tenant login)
            ├── events/                    # appointments, queue, consents, …
            └── occurrence/                # Clinical Occurrence Report
```

**Convention:** Keep automation **outside** `src/` app code so app and test concerns stay separate.

---

## 6. CI workflow — typecheck + unified playwright (template)

This is the pattern used in Proactive IQ. Adapt names and paths per project.

### Job A: `typecheck`

**Goal:** Fast fail on TypeScript errors before expensive E2E setup.

1. Checkout frontend PR branch
2. `yarn install --frozen-lockfile` (no Playwright browsers)
3. `yarn typecheck` (covers `qa-automation/` too)

### Job B: `playwright`

**Goal:** Build stack and run tests on one runner — **no inter-job artifacts**.

1. Checkout frontend + backend repos
2. Setup Node, Yarn, Playwright Chromium, Next.js cache
3. **Build API image and `yarn build` in parallel** (scoped GHA cache `e2e-api-develop`, `mode=min`)
4. `docker compose up -d --no-build --wait`
5. **Seed test user** (see section 7)
6. `yarn start` → wait for `:3000`
7. `yarn test:playwright:ci`
8. Always: `docker compose down -v`
9. On **failure only**: upload HTML / JUnit / traces (7-day retention)

**Storage note:** Never upload `.next` or Docker images as workflow artifacts — org artifact quota is limited.

### Job C: `cleanup-artifacts`

Runs when `typecheck` and `playwright` both succeed. Deletes any artifacts from the current workflow run. Failure runs keep report artifacts for debugging.

### Optional: `playwright-skipped`

Passing job when PR is **draft** or has label **`skipped-playwright`** so branch protection still succeeds.

---

## 7. Test user seeding (critical — QA-owned)

### Why not use the registration API?

Many apps create **inactive** users on self-registration (admin approval required). Login tests need an **active** user with the right flags.

### Proactive IQ approach

| File | Purpose |
|------|---------|
| `qa-automation/src/fixtures/e2e-user.json` | Email, password, display name |
| `qa-automation/src/scripts/seed-e2e-user.py` | Django shell script |

**CI steps:**

```bash
docker compose cp qa-automation/src/fixtures/e2e-user.json api:/tmp/e2e-user.json
docker compose exec -T api python manage.py shell < qa-automation/src/scripts/seed-e2e-user.py
```

**User must have (Proactive IQ):**

- `is_active=true`, `is_superuser=true`
- `first_time_login=false` — avoids redirect to `/change-password`
- Empty RBAC roles — unscoped superuser sees full sidebar (navigation tests)

### Adapting to other backends

| Backend type | Seed strategy |
|--------------|---------------|
| Django | Shell script or `createsuperuser` + update flags |
| Node/Express | SQL insert, admin API, or seed npm script in container |
| .NET | EF migration seed or `/api/admin/seed` test-only endpoint |
| No DB access | Pre-built Docker image with seed data (less flexible) |

**Golden rule:** Seeding logic lives in the **QA/frontend repo**, not the backend repo, when QA lacks backend write access.

### Credentials must match

| Source | Used by |
|--------|---------|
| `e2e-user.json` | Seed script (creates user in DB) |
| GitHub secrets `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | Playwright login |
| Local `.env` | Local runs |

All three must use the **same** email/password.

---

## 8. Playwright project structure (QA patterns)

### Projects in `playwright.config.ts`

Split specs by **speed** and **dependencies**:

| Project | When to use |
|---------|-------------|
| `ui-chromium` | Page loads, forms, links — minimal backend |
| `e2e-chromium` | Login, navigation, core journeys |
| `e2e-*-setup` | Creates data another spec depends on |
| `api` | Direct HTTP tests (optional) |

**Proactive IQ CI command:**

```bash
yarn test:playwright:ci
# playwright test --project=e2e-purpose-setup --project=e2e-schedule-setup \
#   --project=e2e-public --project=e2e-modules --project=e2e-events \
#   --project=e2e-queue-claim --project=e2e-occurrence --project=e2e-chromium \
#   --project=ui-chromium
#   (setup projects earlier in the chain run automatically via Playwright dependencies)
```

**Project dependencies example (Proactive IQ chain):**

```text
e2e-client-setup ──► e2e-location ──► e2e-tenant-context ──► e2e-purpose-setup ──► e2e-schedule-setup
                                            │                                            │
                                            ▼                                            ▼
                                     e2e-occurrence                            e2e-public ──► e2e-events
                                                                                    │
                                                                                    └──► e2e-queue-claim

e2e-modules branches directly off e2e-schedule-setup (parallel with e2e-public's branch).
```

Use Playwright `dependencies: ['project-name']` so order is guaranteed in CI.

### Concurrency-capped resources

Some backends enforce a scarce **per-user or per-session** resource lock — e.g. "one in-progress claim per staff user per location." Playwright workers run across files *and* projects concurrently by default, so specs that touch that lock will collide even if they look sequential within one file.

**Fix:** give those specs their **own project** with `workers: 1` — this overrides the global `workers` setting for just that project, forcing true one-at-a-time execution:

```ts
{
  name: "e2e-queue-claim",
  testDir: "./qa-automation/tests/e2e/events",
  testMatch: ["**/queue-display.e2e.spec.ts", "**/queue-process-appointment.e2e.spec.ts"],
  dependencies: ["e2e-public"],
  workers: 1,
  use: tenantStorageState,
}
```

Do **not** reach for `test.describe.serial` inside a shared-worker project as the fix — it only orders tests within one file/worker, not across the parallel workers Playwright assigns by default.

### Global setup (authenticated tests)

One login before the suite → save `storage-state.json` → reuse in specs that need auth.

Skip global setup when `TEST_USER_*` env vars are missing (optional local dev).

### CI guards (recommended)

| Setting | Suggested CI value |
|---------|-------------------|
| `workers` | `2` (raise only if backend/DB handles load) |
| `retries` | `2` |
| `maxFailures` | `5` (fail-fast) |
| `globalTimeout` | `50 min` |
| `forbidOnly` | `true` |

---

## 9. GitHub secrets and labels checklist

### Required secrets (frontend repo)

| Secret | Purpose |
|--------|---------|
| `BACKEND_REPO_PAT` | Read private backend repo in CI |
| `SESSION_SECRET` | Frontend production build (Next.js) |
| `TEST_USER_EMAIL` | Playwright login (must match `e2e-user.json`) |
| `TEST_USER_PASSWORD` | Playwright login (must match `e2e-user.json`) |

### PAT troubleshooting (common)

- Error: `Repository not found` on backend checkout → PAT missing or no access to private repo
- Fine-grained PAT may not list your org → use **classic PAT** with `repo` scope + SSO authorize, or ask org admin
- Personal browser access ≠ CI token access

### Labels and triggers

| Control | Behavior |
|---------|----------|
| Draft PR | Skip E2E (passing skip job) |
| Label `skipped-playwright` | Skip E2E (docs-only PRs) |
| Ready for Review | Full pipeline runs |
| Concurrency | New push cancels old run on same PR |

Create the `skipped-playwright` label in GitHub before using it.

---

## 10. Docker Compose minimal stack

**Include:** what your API needs to boot and serve requests.

**Proactive IQ includes:**

- Postgres (with init SQL for `pmd_local` + `tuva_db`)
- Redis
- API container (pre-built image tag `pmd-e2e-api:ci`)

**Usually omit in CI:**

- Celery workers (use `RUN_CELERY_TASKS_SYNC=true` if supported)
- LocalStack / S3 (unless tests upload files)
- Email SMTP (use console backend)

**Health check:** Wait for `GET /health/ready/` before seeding or running tests.

---

## 11. Caching and storage

| Cache | What it saves |
|-------|---------------|
| Yarn (`setup-node`) | `yarn install` time |
| Next.js `.next/cache` | Rebuild time |
| Playwright browsers | Browser download |
| Docker BuildKit GHA (`scope=e2e-api-develop`, `mode=min`) | Backend image rebuild without per-PR cache explosion |

**Single-runner layout:** Docker build and `yarn build` run **in parallel** inside `playwright` after `typecheck` passes. No inter-job artifacts.

**Post-run cleanup:** `cleanup-artifacts` deletes any artifacts from successful runs; failure reports are kept for debugging.

---

## 12. Adoption checklist for a new project

Use this when rolling out to another app.

### Phase 1 — Local automation

- [ ] Create `qa-automation/` folder structure
- [ ] Add Playwright + config with `BASE_URL` / `API_BASE_URL` from env
- [ ] Write 1 UI smoke spec + 1 login E2E spec
- [ ] Document local `.env` variables

### Phase 2 — Isolated stack

- [ ] Add `docker-compose.e2e.ci.yml` (API + DB + deps)
- [ ] Confirm API health endpoint works
- [ ] Add `e2e-user.json` + seed script; verify login manually against local stack
- [ ] Set `first_time_login=false` (or equivalent) if app forces password change

### Phase 3 — GitHub Actions

- [ ] Add `BACKEND_REPO_PAT` and other secrets
- [ ] Copy typecheck + unified playwright workflow pattern from Proactive IQ
- [ ] Add composite action for Node/cache (optional)
- [ ] Add `skipped-playwright` label + draft skip job
- [ ] Upload artifacts (HTML report minimum)

### Phase 4 — Branch protection

- [ ] Require `playwright` check on target branch
- [ ] Document for devs: mark PR Ready for Review to trigger E2E

### Phase 5 — Scale (when suite grows)

- [ ] Split UI vs E2E projects in CI command
- [ ] Add project dependencies for data setup specs
- [ ] Consider sharding (each shard = full stack; use when test time >> stack time)
- [ ] Tune `workers` against single backend capacity
- [ ] Identify any server-enforced per-user/session concurrency caps (e.g. one active claim/record at a time) and give those specs a dedicated `workers: 1` project — don't rely on `test.describe.serial` ordering

---

## 13. Customization matrix

| Your project differs… | Change this |
|----------------------|-------------|
| Monorepo (FE + BE together) | Single checkout; adjust compose build context |
| Backend published to GHCR | Optional separate backend build job; avoid workflow artifacts for images |
| Vue / Angular (not Next) | Replace `yarn build` / `yarn start` commands in `playwright` job |
| No Docker for API | Use `services:` in GHA (Postgres/Redis) + `python manage.py runserver` |
| Single repo, no private checkout | Remove `BACKEND_REPO_PAT` step |
| Tests need S3 | Add LocalStack to compose or mock uploads |
| RBAC-heavy app | Seed role + permissions, not only superuser |
| Backend enforces a per-user resource lock (one active claim/session, etc.) | Split those specs into a dedicated `workers: 1` project depending on the shared setup tier |

---

## 14. Proactive IQ — current test inventory

| Spec | Type | Notes |
|------|------|-------|
| Login / Register / Forgot password (UI) | UI | Form and navigation smoke |
| Login / Register / Forgot password (E2E) | E2E | Full flows |
| Navigation | E2E | All sidebar routes visible to superuser |
| Client manager create | E2E | Faker data; needs `add` permission |
| Location manager create | E2E | Depends on client-setup project |

---

## 15. Troubleshooting playbook

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Backend checkout 404 / not found | PAT / permissions | Add `BACKEND_REPO_PAT` |
| `frozen-lockfile` fails | Lockfile drift | Commit updated `yarn.lock` |
| Redirect to change-password after login | First-login flag | Seed `first_time_login=false` |
| Navigation: 0 sidebar links | Wrong user / auth state / on wrong page | Align secrets + seed; check global setup |
| Seed `KeyError: E2E_USER_JSON` | Env not passed into container | Use `docker compose cp` + file read |
| Tests pass locally, fail in CI | `NEXT_PUBLIC_API_URL` wrong at build | Set before `yarn build` in prepare job |
| Draft PR never runs tests | By design | Mark Ready for Review |

---

## 16. Commands quick reference

```bash
# Local (against your chosen backend)
yarn test:playwright:ci
yarn test:playwright
yarn test:report

# CI equivalent projects
yarn test:playwright:ci
```

**Key env vars:**

| Variable | CI value (Proactive IQ) |
|----------|-------------------------|
| `BASE_URL` | `http://localhost:3000` |
| `API_BASE_URL` | `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` (build time) |

---

## 17. Reference files (Proactive IQ)

| File | Description |
|------|-------------|
| `.github/workflows/playwright.yml` | Full CI pipeline |
| `.github/actions/setup-e2e-node/action.yml` | Shared Node/Yarn/cache/Playwright setup |
| `playwright.config.ts` | Projects, workers, reporters |
| `qa-automation/docker-compose.e2e.ci.yml` | Ephemeral backend stack |
| `qa-automation/src/fixtures/e2e-user.json` | Test user |
| `qa-automation/src/scripts/seed-e2e-user.py` | DB seed script |
| `qa-automation/docs/ci-setup.md` | Short internal dev doc |

---

## 18. FAQ for QA leads

**Q: Can we still run against staging for some tests?**  
A: Yes for exploratory or post-deploy smoke, but **PR CI should use isolated stack** for data-mutating tests.

**Q: Do we need backend developers to merge seed code?**  
A: No, if you seed via shell/SQL/API from the frontend repo (this guide's default).

**Q: How long should CI take?**  
A: Proactive IQ ~8–10 min with caching. Budget more as specs and Docker build grow.

**Q: When should we add sharding?**  
A: When Playwright runtime exceeds ~5 min **and** you accept N× stack cost (each shard needs its own environment).

**Q: Who maintains this?**  
A: QA owns specs, fixtures, seed scripts, and workflow; platform/devops helps with secrets and branch protection.

---

## 19. Document history

| Date | Change |
|------|--------|
| 2026 | Initial isolated stack on Proactive IQ |
| 2026 | Single-job E2E + typecheck gate, artifact cleanup, Docker cache, FE-owned seeding |
| 2026 | Company-wide QA playbook (this page) |
| 2026-09-15 | Documented the `e2e-public` tier and the single-worker concurrency-cap pattern (`e2e-queue-claim`); corrected the project dependency diagram and CI command example to match current config |

---

*Copy this page into Confluence under **QA / Engineering / Test Automation**. Link to the live `pmd-platform-ui` repo and [GitHub Actions workflow](../../.github/workflows/playwright.yml) as the canonical reference.*
