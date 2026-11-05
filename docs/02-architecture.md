# 02 — Architecture

## 1. Two layers

```text
src/core/   framework — product-agnostic, copy unchanged
src/app/    product    — paths, copy, page objects, matchers, fixtures, builders
```

The only assumptions `core` makes about a UI live in one object,
[`ui-conventions.ts`](../src/core/config/ui-conventions.ts) (login labels, the data
table's "ready" text and skeleton selector, the row-menu button name, filter button
name, wait budgets). A project overrides them once with `configureUi()` in
`src/app/config/ui.ts`. In ProactiveMD these were hard-coded inside `BasePage`
(`"Rows per page"`, `.animate-pulse`, `"Open menu"`); moving them is what made the
helpers reusable.

Dependency direction is one-way: **`app` imports `core`, never the reverse.**

## 2. Class and helper map

```text
BasePage                                   core/pages/base-page.ts
  goto, expectUrl, expectPageTitle, expectToast
  actAndWaitForResponse(action, matcher)   listener attached BEFORE the action
  selectComboboxOption({...})              remount-safe async combobox
  ├── DataTablePage (abstract)             core/pages/data-table-page.ts
  │     waitForDataTableReady, rowByText, searchDataTable,
  │     clickRowMenuItem, applyListFilter, applyTextListFilter
  └── LoginPage                            core/pages/login-page.ts
        login, submitCredentials, expectOnLandingPage   (app subclass adds heading/title checks)
```

| Helper | File | Purpose |
| --- | --- | --- |
| `env` / `requireEnvValue` | `core/config/env.ts` | validated config; getters throw only when read |
| `configureUi` | `core/config/ui-conventions.ts` | per-project UI conventions |
| `defineStorageStates` | `core/auth/storage-state.ts` | `name → auth/<kebab>.storage-state.json` |
| `loginThroughUI` | `core/auth/auth-helper.ts` | UI login with a swappable `LoginPage` |
| `createGlobalSetup` | `core/auth/global-setup.ts` | log users in once, save sessions |
| `createPageFixtures` | `core/fixtures/fixture-helpers.ts` | `{ name: PageClass }` → fixtures |
| `storageStateContext` | `core/fixtures/fixture-helpers.ts` | `context` fixture from a saved session |
| `matchRequest` / `createResourceMatchers` | `core/api/response-matchers.ts` | network predicates |
| `createRunManifest` | `core/helpers/run-manifest.ts` | typed file-backed hand-off between setup projects |
| `uniqueName`, `buildPerson`, `todayIsoDate`… | `core/data/builders.ts` | parallel-safe data |
| `blockRequests`, `blockTurnstileChallenge`, `waitForTurnstileToken` | `core/support/network.ts` | take third-party widgets out of the picture |

## 3. Sessions: log in once, start every spec authenticated

```text
global-setup (before any project)
   └─ logs in the default user → auth/standard-user.storage-state.json

e2e-setup-workspace   creates a workspace, writes .cache/workspace-manifest.json
e2e-setup-context     loads standard-user session, selects the workspace in the top bar,
                      saves it as auth/scoped.storage-state.json

e2e-rbac-setup        logs in the restricted user → auth/restricted-user.storage-state.json
```

Four fixtures (in `src/app/fixtures/test-fixtures.ts`) map to those sessions:

| Fixture | Session | Use for |
| --- | --- | --- |
| `test` | anonymous | login, public pages, UI smoke |
| `authenticatedTest` | standard user | setup specs, pages that need a login but no tenant |
| `scopedTest` | standard user + selected workspace | feature specs (the default for `modules/`) |
| `restrictedTest` | non-superuser | RBAC specs |

`scopedTest` **throws a readable error** if the scoped file is missing ("run the
setup project"); `authenticatedTest` falls back to anonymous and **skips** when
credentials aren't configured. That asymmetry is deliberate: a missing setup is a
mistake, missing credentials is a legitimate local configuration.

> Why override the `context` fixture instead of setting `use.storageState`? A custom
> `context` fixture (a) lets a fixture decide skip-vs-throw, (b) makes the session a
> property of the *test type* the author chose, not the project that happens to run
> the file. The config still sets `storageState` on projects so plain `test` + `page`
> specs in those folders also start scoped.

## 4. Projects and the dependency chain

Defined in [`playwright.config.ts`](../playwright.config.ts). **Suite membership is the
folder**, not a filename glob — drop a spec in `tests/e2e/modules/` and it joins
`e2e-modules`. Only the setup chain uses `testMatch`, because order inside that
folder matters.

```text
unit            tests/unit                        pure logic, no browser
api             tests/api                         HTTP only (`request` fixture)
ui-chromium     tests/ui                          smoke, no login
e2e-auth        tests/e2e/auth                    login & navigation

e2e-setup-workspace ─► e2e-setup-context ─┬─► e2e-modules    tests/e2e/modules
                                          └─► e2e-serial     tests/e2e/serial  (workers: 1)

e2e-rbac-setup ─► e2e-rbac                         tests/e2e/rbac
```

Playwright runs a project's `dependencies` first, **even when you filter by file or
test title**. Verified: with no saved sessions,
`npx playwright test tests/e2e/modules/item-create.e2e.spec.ts` runs both setup specs
and then the feature spec.

### Single-worker projects for server-capped resources

Some backends allow one "active" thing per user or session — one claimed queue slot,
one in-progress record. Every worker shares one login, so any two such specs running
at once collide, **even across different files**. The fix is a dedicated project with
`workers: 1` (`e2e-serial`), not `test.describe.serial`, which only orders tests inside a
single file/worker. ProactiveMD hit exactly this with its queue "Grab Patient" flow
(`e2e-queue-claim`).

### Why setup is a chain of projects, not one big `beforeAll`

- A failure stops everything that depends on it with a clear reason, instead of N
  confusing downstream failures.
- Setup specs are ordinary specs: traces, retries, reports.
- Dependent tiers can run in parallel with each other once the chain is done.

## 5. The run manifest

`createRunManifest<T>({ fileName })` gives a typed, file-backed store under `.cache/`
(`replace`, `merge`, `read`, `require(...keys)`, `clear`). It exists to pass **names and
ids created in setup** (workspace name, schedule slug…) to downstream specs without
hard-coding shared fixtures.

Rules:

- The **first** setup project calls `replace` (clears stale data from a previous run);
  later ones `merge`.
- Writes are temp-file + rename, so a reader never sees partial JSON.
- It is **not a lock**. Prevent concurrent writers with project `dependencies`. In
  ProactiveMD the module tier depends on the schedule-setup project for exactly this
  reason (a `merge` racing a `read` caused flakes).
- `require()` fails fast and names the missing keys plus your `setupHint`.

## 6. Network matchers

A matcher is `(response) => boolean`, used with `page.waitForResponse`. Hand-writing
them is repetitive: ProactiveMD's `api-matchers.ts` reached **1,189 lines** of
near-identical functions. `createResourceMatchers("/api/items")` returns
`list`, `listSearch(q)`, `listWhere({...})`, `create`, `createError`, `detail`,
`update`, `remove`, `action("cancel")` in one call.

Details worth knowing (all unit-tested in `tests/unit/response-matchers.spec.ts`):

- String paths match by **suffix**, so a proxy prefix (`/api/proxy/api/items`) still matches.
- ID segments tolerate `//` (`/items//42`) by default. A client that appends `/${id}` to
  a base URL ending in `/` produces it — ProactiveMD hit this in several modules.
- Always attach the listener **before** the triggering action
  (`actAndWaitForResponse`), otherwise you race a request that already finished.

## 7. Waiting rules (the flake budget)

| Instead of | Use |
| --- | --- |
| `waitForTimeout(n)` after typing in a search box | `searchDataTable` — waits on the matching response and/or row, then on skeleton rows disappearing |
| `waitForResponse` after `goto` | `waitForDataTableReady` (UI state) — a cached list never re-requests |
| one-shot "open menu, click item" | `clickRowMenuItem` — retries both as a unit; a refetch can close the menu |
| `click()` a Radix submenu | `hover()` then pick the option (`applyListFilter`) |
| re-clicking an async combobox | `selectComboboxOption` — re-opens and re-fills inside `toPass` |

## 8. Reporting and CI guards

| Setting | Local | CI |
| --- | --- | --- |
| retries | 0 | 2 |
| workers | auto | 2 |
| `maxFailures` | – | 5 |
| `globalTimeout` | – | 50 min |
| `forbidOnly` | off | on |
| timeouts (test / action / navigation) | 30 s / 10 s / 30 s | 60 s / 10 s / 60 s |
| artifacts | trace/screenshot/video **retain-on-failure** | HTML report only on failure or flake |

Reporters: `list`, `html`, `junit`, `json` (the JSON feeds flaky detection in CI).
