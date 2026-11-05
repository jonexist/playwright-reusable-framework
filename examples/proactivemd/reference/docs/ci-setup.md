# Playwright CI Setup

For a company-wide QA playbook (how to replicate this pattern on other projects), see [confluence-playwright-playbook.md](./confluence-playwright-playbook.md).

The [Playwright Automation](../../.github/workflows/playwright.yml) workflow runs on pull requests targeting `develop` when the PR is **Ready for Review** and not exempted by label.

## When Playwright runs

| Condition | Playwright runs? |
| --------- | ---------------- |
| PR is **draft** | No — skipped until marked Ready for Review |
| PR has label **`skipped-playwright`** | No — use for docs-only or exempt PRs |
| PR is **Ready for Review** and no skip label | Yes — full pipeline runs |

The workflow re-evaluates on `ready_for_review`, `labeled`, and `unlabeled` events. In-flight runs are cancelled when a new event arrives for the same PR (concurrency).

When skipped, a lightweight `playwright` job succeeds with a message so branch protection is not blocked.

### Skip label

Create or use the GitHub label **`skipped-playwright`** on docs-only PRs that do not need E2E coverage. Remove the label to trigger a full Playwright run.

## Workflow jobs

Three jobs on a full run — typecheck gates the unified E2E job; successful runs clean up artifacts automatically:

```text
typecheck ──► playwright ──► cleanup-artifacts (success only)
```

| Job | Purpose |
| --- | ------- |
| `typecheck` | Fast fail on `yarn typecheck` (no Playwright browsers) |
| `playwright` | Build Docker + Next.js in parallel, start stack, run tests (no inter-job artifacts) |
| `cleanup-artifacts` | Delete any artifacts from this workflow run when `playwright` succeeds |

When skipped (draft PR or `skipped-playwright` label), only `playwright-skipped` runs.

The Docker image and `.next` build stay on the same runner — **no artifact upload** between jobs.

## Caching

| Cache | Key | Used by |
| ----- | --- | ------- |
| Yarn (via `setup-node`) | lockfile | `typecheck`, `playwright` |
| Playwright browsers | `yarn.lock` | `playwright` |
| Next.js build cache | lockfile + source hash | `typecheck`, `playwright` |
| Docker layers | BuildKit GHA cache (`scope=e2e-api-develop`, `mode=min`) | `playwright` |

Both jobs use [`.github/actions/setup-e2e-node`](../../actions/setup-e2e-node/action.yml). `typecheck` skips Playwright browser install (`install-playwright: false`).

## Isolated E2E stack (CI)

CI no longer targets staging. The `playwright` job spins up an ephemeral stack on the GitHub Actions runner. The backend repo is checked out and built in the same job; the image is loaded on the runner and started with `docker compose up --no-build`.

| Component | Source | URL |
| --------- | ------ | --- |
| Postgres + Redis + API | [`docker-compose.e2e.ci.yml`](../docker-compose.e2e.ci.yml) | `http://localhost:8000` |
| Next.js (production build in `playwright`, served on same runner) | PR branch of this repo | `http://localhost:3000` |
| Backend code | `Wellness-For-Life/pmd-data-platform-backend@master` | built in `playwright` job |

The frontend is built with `yarn build` and started with `yarn start` on the same runner (not the repo root `Dockerfile`). Docker in this workflow is used for the backend stack only.

### `typecheck` job

1. Checkout UI (PR branch).
2. Run [setup-e2e-node](../../actions/setup-e2e-node/action.yml) with `install-playwright: false`.
3. `yarn typecheck`.

### `playwright` job

1. Checkout UI (PR branch) and backend (`master`).
2. Setup E2E Node (yarn install, Playwright Chromium, Next.js cache).
3. **Build API image and `yarn build` in parallel** (BuildKit GHA cache, scoped `e2e-api-develop`).
4. `docker compose up -d --no-build --wait` — Postgres, Redis, pre-built API.
5. Seed test user via [`src/fixtures/e2e-user.json`](../src/fixtures/e2e-user.json) and [`src/scripts/seed-e2e-user.py`](../src/scripts/seed-e2e-user.py).
6. `yarn start` (background) → `wait-on http://localhost:3000` (2 min timeout).
7. Playwright runs against `localhost:3000` / `localhost:8000`.
8. Compose stack torn down (`down -v`) even when tests fail.
9. On **failure only**, upload HTML/JUnit reports and test-results (7-day retention).

Job timeout: **55 minutes** (includes parallel build + up to 25 min Playwright global timeout).

### `cleanup-artifacts` job

Runs only when `typecheck` and `playwright` both succeed. Deletes any artifacts created by **this workflow run** via the GitHub API. Failure runs keep report artifacts for debugging.

### Test user (FE-owned fixture)

User credentials live in [`qa-automation/src/fixtures/e2e-user.json`](../src/fixtures/e2e-user.json). CI copies that file into the API container and runs [`src/scripts/seed-e2e-user.py`](../src/scripts/seed-e2e-user.py) via Django shell to create an **unscoped superuser** (no RBAC roles, `first_time_login=false`, `is_com` / `is_ccm` / `is_rd` true) for full catalog sidebar access and Clinical Occurrence Report write flows.

| Variable | CI value (must match `e2e-user.json`) |
| -------- | ------------------------------------- |
| `TEST_USER_EMAIL` | `<value from e2e-user.json>` |
| `TEST_USER_PASSWORD` | `<value from e2e-user.json>` |

These are set in the `playwright` job env — no GitHub secrets required for test credentials.

## Client Manager create test

The client manager create spec (`qa-automation/tests/e2e/setup/client-manager-create.e2e.spec.ts`) creates a client with a unique faker-generated name (`Leaf Village {suffix}`) and faker-generated supporting data.

- `TEST_USER` needs **`add`** permission on `/administration/client-manager` (create page is behind `RbacActionGate`).
- Client names and employer codes are unique per run via faker to avoid duplicate-field errors from the API.
- Search verification runs **only after** create — pre-create search is avoided because React Query caches empty results.

## Location Manager create test

The location manager create spec (`qa-automation/tests/e2e/setup/location-manager-create.e2e.spec.ts`) creates a location with faker-generated data and links it to an existing **Leaf Village** client.

- Runs in the `e2e-location` project, which **depends on** `e2e-client-setup` (`client-manager-create.e2e.spec.ts`) so a `Leaf Village {suffix}` client exists before the location test runs.
- `TEST_USER` needs **`add`** permission on `/administration/location-manager`.
- Client combobox searches by the **exact client name** from the tenant manifest (`readClientFromManifest`) — not the generic `Leaf Village` prefix — so the location is linked to the client created in the prior setup step.
- Table verification searches **only after** create (same pattern as client manager).

## Purpose setup

The purpose create spec (`qa-automation/tests/e2e/setup/purpose-create.e2e.spec.ts`) creates fixed **Biometric Screening** and **Flu Shot Event** purposes for the E2E tenant client.

- Runs in the `e2e-purpose-setup` project, which **depends on** `e2e-tenant-context` so client/location are selected in the top nav before purposes are created.
- `TEST_USER` needs **`add`** permission on `/events/purposes`.
- Creation is **idempotent**: if a purpose with the expected name already exists for the tenant client, the test skips creation and writes the existing code to the manifest.
- Purpose names and codes are merged into `qa-automation/.cache/e2e-tenant-manifest.json` via `mergePurposeManifest()` for downstream biometric and flu-shot module tests.

## Clinical Occurrence Report

Specs live in `qa-automation/tests/e2e/occurrence/` and run in the `e2e-occurrence` project, which **depends on** `e2e-tenant-context` only (no purpose or schedule).

- Visitor create is the happy path so the suite does not wait on `e2e-modules` patient create.
- The seeded E2E user is `is_com` / `is_ccm` / `is_rd` so the required COC combobox has an option and Edit / Tasks writes are allowed.
- Attachment upload is out of scope (no S3 in the ephemeral compose stack).

## Tenant context setup

Module tests (Patient Creation, Biometrics, etc.) require a **Client Manager** and **Location** selected in the top navigation before the module can be used. A dedicated setup chain creates that data and persists the selection for downstream specs.

### Flow

```text
e2e-client-setup (tests/e2e/setup/client-manager-create)
  └── writes clientName + employerCode to qa-automation/.cache/e2e-tenant-manifest.json (replaces file; clears any stale locationName)
e2e-location (tests/e2e/setup/location-manager-create)
  └── merges locationName into manifest
e2e-tenant-context (tests/e2e/setup/tenant-context-select)
  └── reads manifest, selects client + location in top nav, saves tenant-context.storage-state.json
e2e-purpose-setup (tests/e2e/setup/purpose-create)
  └── creates Biometric Screening + Flu Shot Event purposes (idempotent); merges purpose names/codes into manifest
e2e-schedule-setup (tests/e2e/setup/schedule-*.e2e.spec.ts)
  └── creates schedule + today's open event; merges scheduleName/ids into manifest
e2e-modules (tests/e2e/modules/)
  └── depends on e2e-schedule-setup (avoids parallel read/write of e2e-tenant-manifest.json)
e2e-events (tests/e2e/events/)
  └── Events flows that depend on schedule setup; can run in parallel with e2e-modules
e2e-occurrence (tests/e2e/occurrence/)
  └── Clinical Occurrence Report; depends on e2e-tenant-context only (parallel with purpose/schedule/modules/events)
e2e-chromium (tests/e2e/auth/)
  └── login, register, navigation, forgot-password — no tenant dependency
```

Suite membership is the **folder**. Put a new spec in `auth/`, `setup/`, `modules/`, `events/`, or `occurrence/` — do not add filename globs or `testIgnore` entries.

### Commands

```bash
yarn test:e2e              # auth suite only (e2e-chromium)
yarn test:e2e:setup        # client create → location create → top-nav selection → purpose setup
yarn test:e2e:modules      # schedule setup → modules suite
yarn test:e2e:events       # schedule setup → Events suite
yarn test:e2e:occurrence   # tenant context → Clinical Occurrence Report
yarn test:playwright:ci    # full CI suite (modules + Events + occurrence + auth + UI)
```

The manifest (`.cache/e2e-tenant-manifest.json`) and `tenant-context.storage-state.json` are gitignored and regenerated each run. Manifest merges use temp-file + rename so readers never observe partial JSON.

### Writing module tests

Use `tenantContextTest` from [`test-fixtures.ts`](../src/fixtures/test-fixtures.ts) — the session is already logged in and scoped to the client/location created in setup:

```ts
import { tenantContextTest } from "../../../src/fixtures/test-fixtures";

tenantContextTest.describe("Patient Creation", () => {
  tenantContextTest("creates a patient", async ({ page }) => {
    await page.goto("/path/to/patient-module");
    // ...
  });
});
```

Place patient / biometric / flu-shot specs in `qa-automation/tests/e2e/modules/` (`e2e-modules`, depends on `e2e-schedule-setup`).

Schedule specs live in `qa-automation/tests/e2e/setup/` (`e2e-schedule-setup`). Appointments, consents, AOE, configuration, and queue specs live in `qa-automation/tests/e2e/events/` (`e2e-events`). Clinical Occurrence Report specs live in `qa-automation/tests/e2e/occurrence/` (`e2e-occurrence`, depends on `e2e-tenant-context` only).

Implemented module specs:

- `patient-create.e2e.spec.ts` — Practice Management patient create (`add` on `/practice-management/patients`)
- `patient-create-validation.e2e.spec.ts` — empty Save Patient required-field messages
- `patient-view-edit.e2e.spec.ts` — View Details then edit last name
- `patient-activation.e2e.spec.ts` — deactivate + Active/Inactive list filter
- `role-create.e2e.spec.ts` — Roles & Permissions create (`add` on `/administration/roles`)
- `role-create-validation.e2e.spec.ts` — empty Create role required-field message
- `role-edit-delete.e2e.spec.ts` — edit role name then delete unused role
- `user-create.e2e.spec.ts` — User Management create with unique role + tenant client/location
- `user-create-validation.e2e.spec.ts` — empty Save User required-field messages
- `user-create-duplicate.e2e.spec.ts` — duplicate email error on second create
- `user-view-edit.e2e.spec.ts` — View Profile then edit last name
- `user-activation.e2e.spec.ts` — deactivate, Active/Inactive Status filter, then reactivate
- `user-reject.e2e.spec.ts` — deactivate then reject + Rejected Status filter
- `user-delete.e2e.spec.ts` — hard delete unused user

Later user/role slices (not in this suite yet): password reset (mailbox / set new password), soft delete of a user with history.

- `biometric-create.e2e.spec.ts` — manual biometric create (new + existing patient) with Provider/NPI/Performed Date; full-name list search
- `biometric-wizard.e2e.spec.ts` — list/create wizard chrome, demographics required-field gate, invalid NPI gate
- `biometric-wizard-aoe.e2e.spec.ts` — dedicated purpose + required Registration AOE blocks Continue until answered
- `biometric-edit.e2e.spec.ts` — edit vitals, clinical note, Provider/NPI/Performed Date
- `biometric-relocate.e2e.spec.ts` — change location on completed screening and confirm patient relocate (PMD-602)
- `biometric-cancel.e2e.spec.ts` — send-registration → cancel registration-status screening
- `biometric-complete-registration.e2e.spec.ts` — send-registration → Edit → complete For Registration screening
- `biometric-view.e2e.spec.ts` — View Biometrics from list row menu
- `biometric-list-filter.e2e.spec.ts` — workflow status filter (Completed / Cancelled / For Registration)
- `flu-shot-create.e2e.spec.ts` — manual flu shot create (new + existing patient) with Provider/NPI/Performed Date/CVX; Flu Shot tab + full-name search
- `flu-shot-wizard.e2e.spec.ts` — list/create wizard chrome, demographics required-field gate, invalid CVX gate
- `flu-shot-edit.e2e.spec.ts` — edit vaccine/admin, CVX, Provider/NPI/Performed Date
- `flu-shot-relocate.e2e.spec.ts` — change location on completed flu shot and confirm patient relocate (PMD-602)
- `flu-shot-cancel.e2e.spec.ts` — send-registration → cancel registration-status flu shot
- `flu-shot-complete-registration.e2e.spec.ts` — send-registration → Edit → complete For Registration flu shot
- `flu-shot-view.e2e.spec.ts` — View Flu Shot from list row menu
- `flu-shot-list-filter.e2e.spec.ts` — workflow status filter (Completed / Cancelled / For Registration)
- `schedule-create.e2e.spec.ts` — schedule + open event for today
- `appointments-list.e2e.spec.ts` — appointments list smoke
- `appointments-walkin.e2e.spec.ts` — walk-in register & check-in
- `appointments-actions.e2e.spec.ts` — walk-in Checked In menu: View Details present, Uncheck in gated off (`!is_walk_in`)
- `consent-create.e2e.spec.ts` — consent metadata create
- `aoe-list-create.e2e.spec.ts` — AOE list create
- `configuration-recommendation.e2e.spec.ts` — recommendation template create
- `queue-display.e2e.spec.ts` — waiting column + Grab Patient claim
- `occurrence-list.e2e.spec.ts` — Clinical Occurrence Report list smoke
- `occurrence-create.e2e.spec.ts` — visitor create → profile; list search by ID
- `occurrence-create-patient.e2e.spec.ts` — create PM patient then Patient-type occurrence
- `occurrence-create-health-center.e2e.spec.ts` — Health Center type + Excursion
- `occurrence-create-validation.e2e.spec.ts` — empty submit required-field messages; under-18 parent/guardian
- `occurrence-profile-task.e2e.spec.ts` — profile Tasks section add task
- `occurrence-profile-comment.e2e.spec.ts` — profile Comments section add comment
- `occurrence-edit.e2e.spec.ts` — edit status to Investigation
- `occurrence-close-filter.e2e.spec.ts` — close occurrence then Show Closed list filter

Purpose names and codes from setup are available via `readTenantManifest()`:

```ts
const { biometricPurposeName, fluShotPurposeName, scheduleName } = readTenantManifest();
```

To re-select context manually (e.g. after clearing storage):

```ts
import { readTenantManifest } from "../../src/helpers/e2e-tenant-manifest";

await topNavContextPage.selectClientAndLocation(readTenantManifest());
```

### E2E project order

```text
e2e-client-setup (client-manager-create) ──► e2e-location (location-manager-create)
                                                      │
                                                      ▼
                                            e2e-tenant-context (tenant-context-select)
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    ▼                                 ▼                                 ▼
     e2e-occurrence (tests/e2e/occurrence/)  e2e-purpose-setup (purpose-create)
                                                      │
                                                      ▼
                                            e2e-schedule-setup (schedule-*)
                                                      │
                              ┌───────────────────────┴───────────────────────┐
                              ▼                                               ▼
               e2e-modules (tests/e2e/modules/)                    e2e-events (tests/e2e/events/)

e2e-chromium (tests/e2e/auth/ — login, register, navigation, forgot-password)
```

CI runs `yarn test:playwright:ci`, which includes `--project=e2e-purpose-setup`, `--project=e2e-modules`, `--project=e2e-schedule-setup`, `--project=e2e-events`, and `--project=e2e-occurrence` (Playwright runs dependent projects automatically). `e2e-modules` depends on `e2e-schedule-setup` so schedule manifest writes finish before modules read the shared file. `e2e-occurrence` depends only on `e2e-tenant-context`.

### Required GitHub secrets

| Secret | Purpose |
| ------ | ------- |
| `BACKEND_REPO_PAT` | PAT with read access to `pmd-data-platform-backend` (default `GITHUB_TOKEN` cannot checkout other private repos) |
| `SESSION_SECRET` | Next.js session encryption for `yarn build` in `playwright` |

### Optional GitHub variable

| Name | Required | Default |
| ---- | -------- | ------- |
| `APP_NAME` | No | `PMD-PLATFORM-UI` |

### Playwright job environment

| Variable | CI value | Purpose |
| -------- | -------- | ------- |
| `BASE_URL` | `http://localhost:3000` | Playwright UI base URL |
| `API_BASE_URL` | `http://localhost:8000` | Playwright API project / direct API calls |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Next.js app API routing (baked in at build time in `playwright`) |

## Navigation tests

The sidebar navigation spec (`qa-automation/tests/e2e/auth/navigation.e2e.spec.ts`) discovers catalog routes from `app-nav-manifest.ts` at runtime and only tests links **visible in the sidebar** for the seeded superuser. Routes hidden by role permissions are skipped automatically—not treated as failures.

- Global setup logs in once and saves session state to `qa-automation/auth/user.storage-state.json` (gitignored).

## CI scaling

Playwright config applies suite-wide guards in CI so a growing test run does not hang the job:

| Variable | CI default | Purpose |
| -------- | ---------- | ------- |
| `PLAYWRIGHT_GLOBAL_TIMEOUT_MS` | `1500000` (25 min) | Hard cap for the entire Playwright run |
| `PLAYWRIGHT_MAX_FAILURES` | `5` | Fail-fast after N test failures |
| `TEST_WORKERS` | `2` | Parallel workers |

Individual long-running specs can still call `test.setTimeout()` as needed.

## Local commands

Local runs still use your `.env` (`BASE_URL`, `API_BASE_URL`, optional `TEST_USER_*`). Point at a local or shared backend as needed.

```bash
yarn test:playwright:ci   # ui + e2e projects (same projects as CI)
yarn test:e2e             # auth suite only
yarn test:e2e:setup       # tenant setup chain (client + location + top-nav + purposes)
yarn test:e2e:modules     # schedule setup → modules
yarn test:e2e:events      # schedule setup → Events
yarn test:e2e:occurrence  # tenant context → Clinical Occurrence Report
yarn test:playwright      # All projects including api
yarn test:report          # Open HTML report
```

## Artifacts

### Inter-job artifacts

**None.** The Docker image and `.next` build remain on the same runner — no `upload-artifact` between jobs.

### After test run (failure only)

Uploaded from the `playwright` job **only when tests fail** (`if: failure()`):

- `playwright-html-report` — HTML report from `reports/html`
- `playwright-junit-report` — JUnit XML from `reports/junit`
- `playwright-test-results` — traces, screenshots, videos on failure

Retention: **7 days**. Successful runs upload no report artifacts.

The `cleanup-artifacts` job deletes any artifacts from the current workflow run when `playwright` succeeds (future-proofing; green runs typically have none).

## Storage management

GitHub Actions enforces separate limits on **artifact storage** (org/repo quota) and **cache storage** (10 GB per repo). If CI fails with "Artifact storage quota has been hit" or cache warnings approach 10 GB:

### One-time cleanup (repo admin)

1. **Delete old artifacts** — Repo **Settings → Actions → Artifacts**. Purge stale `e2e-api-image` (from older workflow versions), `e2e-next-build`, and `playwright-*` artifacts from closed PRs.
2. **Prune stale caches** — **Settings → Actions → Caches**. Delete old `buildkit-*` entries, especially `refs/pull/*/merge` caches from closed PRs.
3. **Check org billing** — Artifact quota is often org-wide under **Org Settings → Billing → Actions**.
4. Wait **6–12 hours** for GitHub to recalculate usage after cleanup.

### How this workflow reduces storage

| Measure | What it avoids |
| ------- | -------------- |
| Single-job layout (no inter-job artifacts) | No `.next` or Docker image uploads between jobs |
| Failure-only report uploads | No HTML/JUnit/trace artifacts on green runs |
| `cleanup-artifacts` on success | Removes any stray artifacts from the current run |
| 7-day report retention | Older failure artifacts expire sooner |
| BuildKit `mode=min` + `scope=e2e-api-develop` | Stops per-PR cache explosion (was `mode=max` unscoped) |

### CLI cleanup (optional)

```bash
gh api repos/Wellness-For-Life/pmd-platform-ui/actions/artifacts --paginate
# Delete stale artifact IDs via the API or the GitHub UI
```
