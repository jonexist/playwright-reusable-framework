# 04 — CI setup (GitHub Actions)

Two ready-made pipelines:

| File | Use when |
| --- | --- |
| [`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml) | Out of the box: runs the suite against the bundled demo app. A good starting point for a UI that talks to a hosted or mocked API. |
| [`templates/workflows/playwright-isolated-stack.yml`](../templates/workflows/playwright-isolated-stack.yml) | Your tests **create or change data**: spin up database + API + frontend on the runner every run (the ProactiveMD pattern). |

## Why an isolated stack

| Against a shared environment (staging) | Against an isolated stack in CI |
| --- | --- |
| Tests mutate shared data | Fresh database every run |
| Flaky when the environment is down or busy | Self-contained on the runner |
| Needs long-lived test accounts | One seeded user per run |
| Blocks unrelated PRs when it breaks | Only your PR branch is under test |
| Hard to reproduce locally | Same compose + seed locally and in CI |

If E2E tests create or change data, do not point PR CI at a shared environment unless you
have dedicated test tenants and cleanup jobs. Use shared environments for post-deploy
smoke checks.

## The four layers

```text
1  Test code            page objects, specs, fixtures, playwright.config.ts
2  Environment          docker compose: database + cache + API
3  Seed data (QA-owned) fixture JSON + a script run after the stack is healthy
4  Workflow             build → start stack → seed → run tests → report on failure
```

On one runner (no workflow artifacts between jobs):

```text
Postgres + Redis + API (:8000)   Docker, built on the same runner
Frontend production build (:3000) npm run build / npm run start
Playwright                        talks to localhost only
```

## Job layout

```text
typecheck ──► playwright ──► cleanup-artifacts   (success and not flaky only)
              playwright-skipped                 (draft PR / skip label: a passing check)
```

| Job | Purpose |
| --- | --- |
| `typecheck` | Fast fail on `tsc` before the expensive job. No browsers installed. |
| `playwright` | Build, start stack, seed, run tests, detect flaky tests, upload reports on failure/flake. |
| `cleanup-artifacts` | Delete this run's artifacts after a clean green run (the org artifact quota is shared). |
| `playwright-skipped` | Reports a passing `playwright` check for drafts and `skipped-playwright` PRs so required-check branch protection doesn't block them. |

### Triggers and labels

| Condition | Runs? |
| --- | --- |
| Draft PR | No — skipped until Ready for Review |
| Label `skipped-playwright` | No — for docs-only/exempt PRs. **Create the label first.** |
| Ready for Review, no skip label | Yes |
| New push to the same PR | Cancels the in-flight run (`concurrency`) |

## Secrets and variables

| Name | Where | Purpose |
| --- | --- | --- |
| `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` | secrets | Default user. **Must equal the seed fixture.** |
| `BACKEND_REPO_PAT` | secret | Read a private backend repo (the default `GITHUB_TOKEN` can't) |
| frontend build secret(s) | secrets | e.g. a session-encryption secret needed by `npm run build` |
| `APP_NAME` | variable | Optional display name |

Credentials must match in three places or login silently fails:
`fixtures/e2e-user.json` (seeded into the DB) ↔ repo secrets (CI) ↔ local `.env`.

**PAT troubleshooting**

- `Repository not found` on backend checkout → missing PAT or no access to the private repo.
- A fine-grained PAT may not list your org → use a classic PAT with `repo` scope and
  authorize SSO, or ask an org admin. Your browser access ≠ the token's access.

## Seeding the test user (QA-owned)

Why not the registration API? Many apps create *inactive* users on self-registration.
Tests need an *active* user with the right flags (no forced password change, the right
roles).

- Keep the fixture and seed script **in the test repo**, so seeding needs no backend merge.
- Run it through the app's shell/ORM after the stack reports healthy.
- Make it idempotent (get-or-create, then re-apply every flag).

Templates: [`seed-django-user.py`](../templates/seed/seed-django-user.py),
[`seed-via-api.mjs`](../templates/seed/seed-via-api.mjs) (any backend with an admin API),
[`e2e-user.example.json`](../templates/fixtures/e2e-user.example.json).

| Backend | Seed strategy |
| --- | --- |
| Django | shell script (template) |
| Node/Express | SQL insert, admin API, or a seed script run in the container |
| .NET | EF migration seed or a test-only admin endpoint |
| No DB access | prebuilt image with seed data (least flexible) |

A seeded user typically needs: active, the "unscoped superuser" role for full navigation,
`first_time_login=false` (or equivalent) so login doesn't land on `/change-password`.

## Compose stack guidelines

Include only what the API needs to boot and serve. Usually omit queue workers (run tasks
inline via a sync flag), SMTP (console mail backend), and object storage (unless a test
uploads files). Give the API a real health endpoint and wait on it with `--wait`.
See [`templates/docker/docker-compose.e2e.ci.yml`](../templates/docker/docker-compose.e2e.ci.yml).

## Caching and storage

| Cache | Saves |
| --- | --- |
| `setup-node` npm cache | `npm ci` time |
| `~/.cache/ms-playwright` | browser download (system deps only needed on a cold cache) |
| Framework build cache (e.g. `.next/cache`) | rebuild time |
| Docker BuildKit GHA cache, **scoped**, `mode=min` | backend image rebuild without per-PR cache growth |

Never upload the image or the frontend build as workflow artifacts. Reports are uploaded
only on failure/flake with 7-day retention; a green run uploads nothing.

If CI fails with "Artifact storage quota has been hit": delete stale artifacts and caches
(Settings → Actions), check org billing, and wait 6–12 h for GitHub to recalculate.

## Scaling the run

| Setting | CI default | Why |
| --- | --- | --- |
| workers | 2 | raise only if the backend/DB copes |
| retries | 2 | flakes are *reported* (see below), not hidden |
| `PLAYWRIGHT_MAX_FAILURES` | 5 | fail fast on a broken build |
| `PLAYWRIGHT_GLOBAL_TIMEOUT_MS` | 50 min | hard cap; keep the job `timeout-minutes` above it |

Flaky detection reads `reports/json/results.json` (`stats.flaky`) and keeps the HTML report
as an artifact when a test only passed on retry. Consider **sharding** (each shard needs
its own full stack) only when test time dwarfs stack start-up — roughly > 5 min.

## Branch protection

Require the `playwright` check on your target branch. Tell developers: **mark the PR Ready
for Review to trigger E2E** (drafts are skipped by design).
