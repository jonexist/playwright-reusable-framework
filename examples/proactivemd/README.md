# ProactiveMD reference implementation

This folder is the **real-world implementation** the framework was extracted from:
`pmd-platform-ui/qa-automation` (Next.js 15 + Django REST). It is kept for reference —
**not compiled or run here** (it is excluded from `tsconfig.json` and from Playwright's
`testDir`, and it imports paths that only exist in the PMD repo).

Use it to see how each reusable pattern looks against a real product, then build the
equivalent in your own `src/app/`.

> **Sensitivity.** These files describe a real product's routes, copy, API surface and
> CI. Keep this repository private (or delete `examples/proactivemd/` before sharing it
> outside the company). Credentials are not copied; the one CI test password that appeared
> in `docs/ci-setup.md` was redacted. The PMD source of truth remains the PMD repo.

## What the PMD suite is

| | |
| --- | --- |
| Product | Proactive IQ / ProactiveMD (`pmd-platform-ui`, Django backend `pmd-data-platform-backend`) |
| Size at extraction | **87 spec files** (auth 4 · setup 6 · modules 53 · events 9 · occurrence 9 · public 1 · rbac 2 · ui 3), **44 page-object files** |
| Stack | Playwright + TypeScript + zod + faker, Page Object Model, project dependency chain |
| CI | GitHub Actions on PRs to `develop`: `typecheck → playwright → cleanup-artifacts`; ephemeral Postgres + Redis + API in Docker, Next.js `build/start` on the same runner |
| Tenant model | client → location chosen in the top nav; module specs run in that scoped session |

## Layout of `reference/`

```text
reference/
├── playwright.config.ts              ← project chain, CI guards, reporters, workers:1 queue project
├── config/    env.ts, test-data.ts   ← zod env; paths + copy + faker builders (1,667 lines)
├── auth/      auth-helper, global-setup, storage-state
├── fixtures/  test-fixtures.ts       ← 40+ page fixtures declared by hand (337 lines)
├── helpers/   e2e-tenant-manifest.ts, e2e-user-setup.ts, public-appointment.ts
├── api/       api-matchers.ts        ← 1,189 lines of hand-written matchers
├── support/   turnstile.ts
├── pages/     base-page, login-page, top-nav-context-page, patient-manager/form,
│              client-form, queue-display, app-shell, sidebar-page
├── navigation/ nav-routes.ts          ← sidebar route discovery used by the navigation spec
├── tests/     ui/, e2e/{auth,setup,modules,events,rbac}   ← representative specs of each tier
├── ci/        playwright.yml, setup-e2e-node.action.yml
├── docker/    docker-compose.e2e.ci.yml, postgres-init.sql
├── scripts/   seed-e2e-user.py, seed-e2e-restricted-user.py
├── docs/      ci-setup.md, confluence-playwright-playbook.md   ← the original write-ups
└── skills/    playwright-qa-conventions.SKILL.md              ← the AI-assistant conventions
```

Only a representative subset of the 87 specs and 44 pages is copied (one or two per tier).
The rest follow the same shape.

## PMD file → framework equivalent

| PMD (`reference/…`) | Framework | What changed and why |
| --- | --- | --- |
| `config/env.ts` | `src/core/config/env.ts` | PMD-only keys removed (`HEALTH_ENDPOINT`, `RUN_EXAMPLE_TESTS`, `DASHBOARD_PATH`, `NEXT_PUBLIC_*` fallbacks); `BASE_URL` has a default; added `POST_LOGIN_PATH`, `CHANGE_PASSWORD_PATH`, `START_DEMO_APP`; `dotenv` path derived from the repo root |
| `config/test-data.ts` (1,667 lines) | `src/app/config/app-config.ts` + `src/app/data/builders.ts` + `src/core/data/builders.ts` | Split three ways: generic builders (`uniqueName`, `buildPerson`, `todayIsoDate`) → core; product paths/copy → app config; per-resource builders → app builders |
| `pages/base-page.ts` | `src/core/pages/base-page.ts` + `data-table-page.ts` | Split in two: `BasePage` (goto/url/title/toast/response-wait/combobox) and `DataTablePage` (table/search/filter/row-menu). Hard-coded `"Rows per page"`, `.animate-pulse`, `"Open menu"`, `/^Filters/` moved to `ui-conventions`. The Turnstile helper left `BasePage` for `core/support/network.ts` |
| `pages/login-page.ts` | `src/core/pages/login-page.ts` (+ app subclass) | Credential form generalised (labels from `ui-conventions`, optional submit-response matcher, `expectedPath`); heading/title/link checks stay in the app subclass |
| `pages/top-nav-context-page.ts` | `BasePage.selectComboboxOption` + `src/app/pages/workspace-picker-page.ts` | The remount-safe combobox retry logic became a reusable method |
| `api/api-matchers.ts` (1,189 lines) | `src/core/api/response-matchers.ts` (113 lines) + `src/app/api/matchers.ts` | `createResourceMatchers(path)` replaces ~8 hand-written functions per endpoint. Behaviour kept: suffix matching, `/+` double-slash tolerance, query matching; now unit-tested |
| `fixtures/test-fixtures.ts` (337 lines) | `src/core/fixtures/fixture-helpers.ts` + `src/app/fixtures/test-fixtures.ts` | `createPageFixtures({ …PageClasses })` replaces ~5 boilerplate lines per page; `storageStateContext` replaces the three hand-written `context` overrides |
| `helpers/e2e-tenant-manifest.ts` | `src/core/helpers/run-manifest.ts` + `src/app/helpers/workspace-manifest.ts` | A fixed client/location/purpose/schedule shape became a generic typed manifest (`replace`/`merge`/`require`) |
| `auth/global-setup.ts`, `auth-helper.ts`, `storage-state.ts` | `src/core/auth/*` + `src/app/auth/*` | Factory-based; supports several users; storage-state names → kebab-case paths |
| `support/turnstile.ts` | `src/core/support/network.ts` | `blockRequests` generalised; Turnstile kept as a named example |
| `playwright.config.ts` | `playwright.config.ts` | Same CI guards and reporters. Tiers renamed to be product-neutral (`e2e-setup-workspace` → `e2e-setup-context` → `e2e-modules`; `e2e-queue-claim` → `e2e-serial`) |
| `ci/playwright.yml` | `.github/workflows/playwright.yml` + `templates/workflows/playwright-isolated-stack.yml` | The PMD-specific pipeline became a generic template; the repo's own workflow runs the demo app |
| `docker/`, `scripts/seed-*.py` | `templates/docker/`, `templates/seed/` | De-PMD'd; added an API-based seed variant |
| `docs/*` | `docs/01…06` | Consolidated, de-PMD'd, extended |

## Patterns worth studying in the PMD code

1. **Setup as a project chain** (`playwright.config.ts`): `e2e-client-setup → e2e-location → e2e-tenant-context → e2e-purpose-setup → e2e-schedule-setup → e2e-modules | e2e-public → e2e-events`. Each link writes to the manifest and/or saves a storage state.
2. **`e2e-queue-claim`** (`workers: 1`): the backend allows one in-progress claim per staff user per location, and all workers share one login. The inline comment in the config is the best explanation of why this beats `test.describe.serial`.
3. **`e2e-modules` depends on `e2e-schedule-setup`** purely so the manifest `merge` can't race a module's `read`.
4. **Idempotent setup** (`setup/purpose-create.e2e.spec.ts`): find the existing record first, write its identifiers to the manifest.
5. **Matcher quirks** (`api/api-matchers.ts`): the `/+` allowance for `…/purposes//{id}` and why — read the comments on `isPurposeUpdateResponse` and the service-request matchers.
6. **`searchDataTable`'s row shortcut** (`pages/base-page.ts`): the long comment explains the "row already on screen" trap.
7. **RBAC** (`tests/e2e/rbac`, `scripts/seed-e2e-restricted-user.py`): a seeded non-superuser whose role grants only `view` on one module, plus the denied-page copy in `config/test-data.ts` (`restrictedUserAccess`, `accessDeniedContent`).
8. **Isolated stack** (`docker/`, `ci/`, `docs/confluence-playwright-playbook.md`): QA-owned seeding, parallel image + frontend build, failure-only artifacts, flaky-test detection.
9. **Navigation spec** (`tests/e2e/auth/navigation.e2e.spec.ts` + `pages/sidebar-page.ts` + `navigation/nav-routes.ts`): discovers routes from the app's own nav manifest at runtime and skips role-hidden links — a good example of coupling a test to the product's source of truth. `sidebar-page.ts` imports `@/shared/navigation/app-nav-manifest` from the PMD app source, which is why this one can't run outside the PMD repo.

## Known rough edges in the PMD code (don't copy these)

- `pages/patient-manager-page.ts` sleeps for the search debounce (`waitForTimeout(PATIENT_SEARCH_DEBOUNCE_MS)`), against the suite's own "no `waitForTimeout`" rule. `DataTablePage.searchDataTable` is the replacement.
- `skills/playwright-qa-conventions.SKILL.md` still says to update `e2e-modules` `testMatch` **and** `e2e-chromium` `testIgnore` for new module specs. The current config is folder-based, and `docs/ci-setup.md` says "do not add filename globs or `testIgnore` entries". The skill text is stale.
- The playbook's §14 "current test inventory" lists only five specs; the suite has 87. Treat the PMD repo, not the playbook, as the source of truth for what exists.
- `config/test-data.ts` mixes copy, paths, types and builders for ~25 modules in one 1,667-line file. The framework splits those concerns; for a large product, consider one content+builder file per module under `src/app/config/`.

## Mapping PMD vocabulary to the demo

| PMD | Demo app |
| --- | --- |
| Client + Location (top-nav tenant context) | Workspace (top-bar combobox) |
| `tenant-context.storage-state.json` | `scoped.storage-state.json` |
| `tenantContextTest` | `scopedTest` |
| `e2e-queue-claim` (Grab Patient) | `e2e-serial` (Claim slot) |
| `restrictedTest` + seeded Roles viewer | `restrictedTest` + `viewer@example.com` |
| `readTenantManifest()` | `workspaceManifest.require(...)` |
| shadcn `DataTable` + `FilterGroup` | demo table with the same ARIA roles/labels |
