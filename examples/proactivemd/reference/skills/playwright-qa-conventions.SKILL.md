---
name: playwright-qa-conventions
description: Playwright QA automation conventions (POM pattern, project/spec naming, fixtures, no waitForTimeout, secrets handling). Use when writing or editing files under qa-automation/ or playwright.config.ts.
paths:
  - "qa-automation/**/*"
  - "playwright.config.ts"
---

# QA Automation (Playwright)

## Location & stack

- All automation lives under `qa-automation/`. Config: [`playwright.config.ts`](playwright.config.ts).
- **Playwright only** — do not add Cypress/Selenium or put specs under app `src/`.
- Utils/schemas/components → Vitest (see the `add-unit-test-coverage-module` skill / `unit-tests.mdc`). Playwright is for journeys and UI smoke only — never a unit-test substitute.

## File naming → projects

| Specs | Project |
|-------|---------|
| `tests/ui/*.ui.spec.ts` | `ui-chromium` |
| Setup chain (`client-manager-create`, `location-manager-create`, `tenant-context-select`, `purpose-create`) | Dedicated setup projects |
| `patient-*.e2e.spec.ts`, `biometric-*.e2e.spec.ts`, `flu-shot-*.e2e.spec.ts` | `e2e-modules` |

New module patterns: update `e2e-modules` `testMatch` **and** `e2e-chromium` `testIgnore` in `playwright.config.ts`.

## Setup dependency chain

```text
e2e-client-setup → e2e-location → e2e-tenant-context → e2e-purpose-setup → e2e-schedule-setup → e2e-modules
                                                                                 ↘ e2e-events
```

Do not invent ad-hoc login for tenant-scoped modules. Use `storageState: qa-automation/auth/tenant-context.storage-state.json`. Local prerequisite: `yarn test:e2e:setup`. CI notes: [`qa-automation/docs/ci-setup.md`](qa-automation/docs/ci-setup.md).

## POM + fixtures

- Specs stay thin. Locators/actions in `qa-automation/src/pages/*-page.ts` (extend `BasePage`).
- Use `test` / `authenticatedTest` / `tenantContextTest` from [`test-fixtures.ts`](qa-automation/src/fixtures/test-fixtures.ts). Register new page objects there.
- Copy and builders: [`test-data.ts`](qa-automation/src/config/test-data.ts). Env: [`env.ts`](qa-automation/src/config/env.ts).

```typescript
// ❌ BAD — fragile locator + sleep in the spec
await page.locator('//div[contains(@class,"combo")]').click();
await page.waitForTimeout(2000);

// ✅ GOOD — page object + role/label + unique faker data
const client = buildClientFormValues();
await clientFormPage.createClient(client);
```

## Selectors, data, secrets, RBAC

- Prefer `getByRole` / `getByLabel` / copy from `test-data.ts`. Avoid CSS-class XPath and `waitForTimeout`; wait on UI/network.
- Mutating data: **faker** unique names; share IDs via tenant manifest helpers (`.cache/`, gitignored). No hardcoded shared-staging fixtures.
- Never commit `auth/*.storage-state.json`, `.cache/`, or passwords. Keep `e2e-user.json` aligned with `TEST_USER_*`. Mutating E2E targets the isolated stack in CI — not shared staging.
- Document required permissions on specs. Treat role-hidden nav as skippable; do not assert every route for every user.
