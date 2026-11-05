# Playwright Reusable Framework

A starting point for Playwright E2E/UI/API automation, extracted from the
production-proven **ProactiveMD** suite (`pmd-platform-ui/qa-automation`: 87 specs,
isolated-stack CI on GitHub Actions). Clone it, swap the **app layer** for your
product, keep the **core layer** as is.

> Runs green out of the box against a bundled demo app — no external site,
> backend or credentials to set up.

```bash
npm ci
npx playwright install chromium     # first time only
cp .env.example .env                # demo credentials, safe to commit-ignore
npm test                            # starts the demo app, runs everything
```

## What you get

| Capability | Where | Notes |
| --- | --- | --- |
| Page Object base classes | `src/core/pages/` | `BasePage`, `DataTablePage` (search / filter / row menu helpers), `LoginPage` |
| Typed env config | `src/core/config/env.ts` | zod-validated, placeholder-safe, CI controls |
| One-place UI conventions | `src/core/config/ui-conventions.ts` | the only app-specific strings the core helpers assume |
| Login once, reuse everywhere | `src/core/auth/` | global setup writes storage state; fixtures load it |
| Fixture factories | `src/core/fixtures/` | register a page object in one line; storage-state `context` fixtures |
| REST response matchers | `src/core/api/` | `createResourceMatchers("/api/x")` → list/search/create/update/delete/action |
| Setup-chain data hand-off | `src/core/helpers/run-manifest.ts` | atomic file manifest between ordered setup projects |
| Faker data builders | `src/core/data/` | unique, prefixed, parallel-safe test data |
| Project dependency chain | `playwright.config.ts` | `unit`, `api`, `ui`, `auth`, setup chain → `modules`, single-worker `serial`, `rbac` |
| CI | `.github/` + `templates/workflows/` | draft/label skip, flaky detection, failure-only artifacts, isolated-stack template |
| Isolated-stack kit | `templates/` | compose file, seed scripts (Django + generic API), page/spec scaffolds |
| ProactiveMD reference | `examples/proactivemd/` | the real implementation this was extracted from, mapped file-by-file |

## The one idea that makes it reusable

```text
src/
├── core/   ← framework. Copy unchanged into every project.
│            No product names, URLs, labels or business objects.
└── app/    ← YOUR product. Rewrite per project.
             paths, copy, page objects, matchers, fixtures, builders.
```

If a change only makes sense for one product, it belongs in `src/app/`. If it
would help every project, it belongs in `src/core/` (and is worth upstreaming
here). The demo app layer doubles as a worked example of what a real app layer
looks like.

## Repository layout

```text
.
├── src/
│   ├── core/                 # reusable framework (see docs/02-architecture.md)
│   │   ├── api/              # response-matchers.ts
│   │   ├── auth/             # storage-state, auth-helper, global-setup factory
│   │   ├── config/           # env.ts, ui-conventions.ts
│   │   ├── data/             # faker builders
│   │   ├── fixtures/         # createPageFixtures, storageStateContext
│   │   ├── helpers/          # run-manifest.ts
│   │   ├── pages/            # base-page, data-table-page, login-page
│   │   └── support/          # network blocking, captcha helpers
│   └── app/                  # the demo product's layer (replace per project)
├── tests/
│   ├── unit/                 # pure logic, no browser        → project `unit`
│   ├── api/                  # direct HTTP via `request`     → project `api`
│   ├── ui/                   # fast smoke, no login          → project `ui-chromium`
│   └── e2e/
│       ├── auth/             # login/navigation              → `e2e-auth`
│       ├── setup/            # ordered data/session bootstrap → `e2e-setup-*`, `e2e-rbac-setup`
│       ├── modules/          # feature specs (scoped session) → `e2e-modules`
│       ├── serial/           # server-capped resources        → `e2e-serial` (workers: 1)
│       └── rbac/             # restricted-user specs          → `e2e-rbac`
├── demo-app/                 # in-memory app the examples run against
├── templates/                # CI workflow, compose, seed scripts, page/spec scaffolds
├── examples/proactivemd/     # the ProactiveMD implementation, mapped to this framework
├── docs/                     # start at docs/01-getting-started.md
└── .github/                  # CI workflow + composite setup action
```

## Documentation

| Doc | Read it when |
| --- | --- |
| [01 — Getting started](docs/01-getting-started.md) | first run, commands, env vars |
| [02 — Architecture](docs/02-architecture.md) | you want to understand layers, projects, sessions, the manifest |
| [03 — Writing tests](docs/03-writing-tests.md) | adding a page object, spec, matcher or fixture |
| [04 — CI setup](docs/04-ci-setup.md) | wiring GitHub Actions, secrets, isolated stack |
| [05 — Adopting in a new project](docs/05-adopting-in-a-new-project.md) | starting a new product's suite from this repo |
| [06 — Troubleshooting](docs/06-troubleshooting.md) | something is flaky, red or confusing |
| [ProactiveMD reference](examples/proactivemd/README.md) | you want the real-world version of any pattern |

## Commands

```bash
npm test                 # everything (starts the demo app via webServer)
npm run test:unit        # pure-logic specs
npm run test:api         # direct HTTP specs
npm run test:ui          # UI smoke
npm run test:e2e         # auth specs
npm run test:e2e:setup   # workspace create → select (writes the scoped session)
npm run test:e2e:modules # setup chain → feature specs
npm run test:e2e:serial  # single-worker, server-capped specs
npm run test:e2e:rbac    # restricted-user specs
npm run test:headed      # watch it run
npm run test:debug       # Playwright inspector
npm run test:codegen     # record a locator/flow
npm run test:report      # open the HTML report
npm run typecheck        # tsc --noEmit (CI gate)
```

## Principles (enforced by convention, see `docs/03-writing-tests.md`)

1. Specs are thin; locators and actions live in page objects.
2. Role/label locators; no CSS-class XPath; **no `waitForTimeout`** — wait on UI state or the network.
3. Every created record is unique (faker + `!E2E` prefix) so parallel workers and reruns never collide.
4. Start specs from a saved session instead of re-doing login/tenant selection.
5. Only one setup project writes the run manifest at a time (`dependencies`, not locks).
6. Never commit `.env`, `auth/*.storage-state.json` or `.cache/`.
