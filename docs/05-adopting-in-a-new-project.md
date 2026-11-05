# 05 — Adopting the framework in a new project

Approach: **use this repository as a template**, don't depend on it as a package. Your
project gets its own copy; improvements to `core/` are upstreamed here by hand. (If
several teams end up sharing it, promote `src/core/` to a private npm package — it has no
product dependencies, so that move is mechanical.)

## Where does the suite live?

| Setup | Do this |
| --- | --- |
| Dedicated QA repo | Use this repo as the template. Point `BASE_URL`/`API_BASE_URL` at the product. |
| Inside the product's frontend repo (ProactiveMD's layout) | Copy this repo into a `qa-automation/` folder; merge the config into the repo's root `playwright.config.ts`; keep automation **outside** the app's `src/`. |

## Phase 1 — Local, no CI (about a day)

1. **Create the repo/folder** from this template; run `npm ci`, `npm test` and confirm the demo is green.
2. **Strip the demo**: delete `demo-app/`, the `webServer` block in `playwright.config.ts`,
   `START_DEMO_APP`, and the demo's `src/app/**` + `tests/**`. Keep `src/core/**`,
   `tests/unit/**`, `templates/`, `docs/`.
3. **Point at the product**: set `BASE_URL`, `API_BASE_URL`, `LOGIN_PATH`, `POST_LOGIN_PATH`
   (and `CHANGE_PASSWORD_PATH` if the app forces a password change) in `.env`.
4. **Configure UI conventions** in `src/app/config/ui.ts` — only what differs from
   [the defaults](../src/core/config/ui-conventions.ts): login labels/button, the data
   table's ready text and skeleton selector, row-menu button name, filter button name.
5. **Write the app layer**, smallest slice first:
   - `app-config.ts`: `appPaths`, login copy, `testUsers`, `hasTestUserCredentials`
   - `pages/login-page.ts` (extend core `LoginPage`), `auth/storage-states.ts`, `auth/global-setup.ts`
   - `fixtures/test-fixtures.ts` with `test` and `authenticatedTest`
6. **First two specs**: one `tests/ui/login.ui.spec.ts` smoke, one `tests/e2e/auth/login.e2e.spec.ts`.
7. **Tenant bootstrap** (only if the product is multi-tenant): create the setup chain
   (`workspace-create` → `context-select`) and `scopedTest`. Rename the projects/files
   to the product's vocabulary (ProactiveMD: client → location → tenant-context →
   purposes → schedule).
8. **Grow by module**: use the scaffolds in `templates/scaffold/`; one page object per screen,
   one folder tier per kind of spec.

## Phase 2 — Isolated stack

1. Copy `templates/docker/docker-compose.e2e.ci.yml` and adapt services; confirm the API
   health endpoint and that `docker compose up -d --wait` goes green locally.
2. Add `fixtures/e2e-user.json` (throwaway CI-only credentials) and the seed script; seed
   locally and log in manually.
3. Set the first-login flag (or equivalent) so login lands where `POST_LOGIN_PATH` says.

## Phase 3 — CI

1. Copy `templates/workflows/playwright-isolated-stack.yml` → `.github/workflows/playwright.yml`
   and replace every `<PLACEHOLDER>`.
2. Add secrets (see [04 — CI setup](04-ci-setup.md)); create the `skipped-playwright` label.
3. Keep `.github/actions/setup-e2e-node` (npm) or adapt it for yarn/pnpm.

## Phase 4 — Branch protection

Require the `playwright` check on the target branch; document "mark Ready for Review to
run E2E" for developers.

## Phase 5 — Scale

- Split UI vs E2E in the CI command when the suite grows; add project `dependencies` for
  data setup.
- Identify any **server-enforced per-user or per-session concurrency cap** and give those
  specs a dedicated `workers: 1` project.
- Tune `workers` against single-backend capacity before reaching for sharding.

## Customisation matrix

| Your project differs… | Change this |
| --- | --- |
| Monorepo (frontend + backend together) | One checkout; adjust compose build context |
| Backend image in a registry | Pull it instead of building; still avoid workflow artifacts for images |
| Vue/Angular/other frontend | Replace the build/start commands in the workflow |
| No Docker for the API | Use GitHub `services:` (Postgres/Redis) + start the API process directly |
| Single repo, no private checkout | Remove the backend checkout and `BACKEND_REPO_PAT` |
| Tests upload files | Add object storage (e.g. LocalStack) to compose, or skip upload specs in CI |
| RBAC-heavy product | Seed roles/permissions, not only a superuser; add one storage state per role under test |
| Different design system (not shadcn/Radix) | Override `ui-conventions`; if filters/menus aren't Radix, subclass `DataTablePage` and override those helpers |
| yarn/pnpm | Change the scripts' package manager, the composite action's `cache:` and `ci` command, and the browser cache key |

## What to port back to `core/`

If a helper you wrote has no product words in it, upstream it. Good candidates: a new
generic table interaction, a better combobox strategy, a matcher option. If it mentions a
route, label or business object, it stays in your `app/`.

## Pre-flight checklist

- [ ] `npm run typecheck` and `npm test` green locally
- [ ] `.env`, `auth/*.storage-state.json`, `.cache/` ignored by git (`git status` clean)
- [ ] Credentials: seed fixture ↔ secrets ↔ `.env` all match
- [ ] Mutating specs target the isolated stack, never a shared environment
- [ ] `skipped-playwright` label exists; `playwright` is a required check
- [ ] The example/demo code and demo credentials are removed from the product's repo
