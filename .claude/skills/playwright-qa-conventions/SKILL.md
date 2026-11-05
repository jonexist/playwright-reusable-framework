---
name: playwright-qa-conventions
description: Conventions for this Playwright framework (core/app layers, POM, fixtures, project folders, no waitForTimeout, secrets). Use when writing or editing anything under src/, tests/ or playwright.config.ts.
paths:
  - "src/**/*"
  - "tests/**/*"
  - "playwright.config.ts"
---

# Playwright framework conventions

Full docs: `README.md` and `docs/`. This is the short version for assistants.

## Layers

- `src/core/**` is product-agnostic and shared across projects. **Never** put product
  names, routes, labels or business objects there. Changes to `core` should help every project.
- `src/app/**` is the product layer: `config/app-config.ts` (paths, copy, users),
  `pages/`, `api/matchers.ts`, `data/builders.ts`, `fixtures/test-fixtures.ts`, `auth/`.
- `app` imports `core`; `core` never imports `app`.
- `examples/**`, `templates/**`, `demo-app/**` are reference material, not compiled.

## Specs and projects

The **folder** picks the project — never add filename globs or `testIgnore` to place a spec.

| Folder | Fixture | Project |
| --- | --- | --- |
| `tests/unit` | plain `@playwright/test` | `unit` |
| `tests/api` (`*.api.spec.ts`) | `request` | `api` |
| `tests/ui` (`*.ui.spec.ts`) | `test` | `ui-chromium` |
| `tests/e2e/auth` | `test` | `e2e-auth` |
| `tests/e2e/setup` | `authenticatedTest` | `e2e-setup-*` (ordered via `dependencies`) |
| `tests/e2e/modules` | `scopedTest` | `e2e-modules` |
| `tests/e2e/serial` | `scopedTest` | `e2e-serial` (`workers: 1`) |
| `tests/e2e/rbac` | `restrictedTest` | `e2e-rbac` |

Do not invent ad-hoc login in feature specs: start from a saved session via the fixtures.

## Page objects

- Specs are thin. Locators and actions live in page objects (`BasePage` / `DataTablePage`).
- Register every page object in the `pages` map in `src/app/fixtures/test-fixtures.ts`.
- Copy strings and routes live in `app-config.ts`; resource matchers come from
  `createResourceMatchers`; unique data from `buildXValues()` (faker + `!E2E` prefix).

```ts
// BAD — fragile locator + sleep in the spec
await page.locator('//div[contains(@class,"combo")]').click();
await page.waitForTimeout(2000);

// GOOD — page object + role/label + unique data
await itemFormPage.createItem(buildItemValues());
```

## Waiting and selectors

- Prefer `getByRole` / `getByLabel` / copy from `app-config.ts`. No CSS-class XPath. **No `waitForTimeout`.**
- Attach `waitForResponse` listeners **before** the triggering action (`actAndWaitForResponse`).
- Lists: `waitForDataTableReady`, `searchDataTable`, `clickRowMenuItem`, `applyListFilter`.
- Async comboboxes: `selectComboboxOption`.

## Data, secrets, permissions

- Every created record is unique; share ids through a run manifest, not fixed names.
- Only one setup project writes a manifest at a time (use `dependencies`; it is not a lock).
- Never commit `.env`, `auth/*.storage-state.json`, `.cache/` or real credentials. Seed-fixture
  credentials, repo secrets and `.env` must all match.
- Mutating E2E targets the isolated stack, never shared staging.
- Document the permission a spec needs; treat role-hidden navigation as skippable.
- Before finishing: `npm run typecheck` and the affected `--project`.
