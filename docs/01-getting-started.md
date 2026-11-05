# 01 — Getting started

## Prerequisites

- Node.js 20+ (the CI uses 20; local development has been run on newer versions)
- npm (a `package-lock.json` is committed; CI uses `npm ci`)

## First run

```bash
npm ci
npx playwright install chromium   # or: npm run browsers:install (adds OS deps on Linux)
cp .env.example .env
npm test
```

`npm test` starts the bundled demo app (`demo-app/server.js`) through Playwright's
`webServer`, waits for `/api/health`, then runs every project. A clean run is ~15 s.

To use the demo app on its own: `npm run demo:start` → <http://localhost:4173>
(logins are in `.env.example`).

## Environment variables

Defined and validated in [`src/core/config/env.ts`](../src/core/config/env.ts). Anything
blank or left as a `replace-with-…` placeholder counts as **not set**, and
credential-gated specs then skip instead of failing a login.

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:4173` | App under test |
| `API_BASE_URL` | `BASE_URL` | Target of the `api` project |
| `START_DEMO_APP` | `true` | `false` to stop Playwright starting the demo app (use for a real app) |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | – | Default user; logged in once by global setup |
| `TEST_RESTRICTED_USER_EMAIL` / `…_PASSWORD` | – | Read-only user for RBAC specs |
| `LOGIN_PATH` | `/login` | Login route |
| `POST_LOGIN_PATH` | `/dashboard` | Default landing after login |
| `CHANGE_PASSWORD_PATH` | – | Optional interstitial that also counts as "logged in" |
| `CI` | `false` | `true` → retries 2, workers 2, fail-fast 5, global timeout 50 min, `forbidOnly` |
| `TEST_WORKERS` | auto | Override worker count |
| `PLAYWRIGHT_GLOBAL_TIMEOUT_MS` | CI: 50 min | Hard cap for the whole run (`0` disables) |
| `PLAYWRIGHT_MAX_FAILURES` | CI: 5 | Stop after N failures |

## Running a subset

Playwright runs a project's `dependencies` automatically, so you rarely need to run
setup by hand:

```bash
npm run test:e2e:modules                       # setup chain → feature specs
npx playwright test --project=e2e-modules -g "archives"   # one test by title
npx playwright test tests/e2e/modules/item-create.e2e.spec.ts --project=e2e-modules
```

Dependencies run even when you filter by file or title (`npx playwright test
tests/e2e/modules/item-create.e2e.spec.ts` also runs both setup specs first), so a cold
checkout with no saved sessions still works. Both forms were verified against this repo.

## Debugging

```bash
npm run test:headed -- --project=e2e-auth
npm run test:debug  -- --project=e2e-modules -g "creates an item"
npx playwright show-trace test-results/<test-folder>/trace.zip
npm run test:report
```

Traces, screenshots and video are kept **only for failures** (`retain-on-failure`).

## Outputs (all gitignored)

| Path | Contents |
| --- | --- |
| `reports/html`, `reports/junit`, `reports/json` | Reporters |
| `test-results/` | Per-test traces, screenshots, videos |
| `auth/*.storage-state.json` | Saved sessions — **contain live session cookies, never commit** |
| `.cache/*.json` | Run manifest handed between setup projects |

## Where to go next

- Understand how it fits together → [02 — Architecture](02-architecture.md)
- Add your first spec → [03 — Writing tests](03-writing-tests.md)
- Point it at your own product → [05 — Adopting in a new project](05-adopting-in-a-new-project.md)
