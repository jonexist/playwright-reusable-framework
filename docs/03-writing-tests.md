# 03 — Writing tests

Scaffolds for everything below are in [`templates/scaffold/`](../templates/scaffold/).

## Where does my spec go?

The **folder** picks the Playwright project. Never add filename globs or `testIgnore`
entries to make a spec land somewhere.

| You are testing… | Folder | Name | Fixture | Project |
| --- | --- | --- | --- | --- |
| a pure function / matcher / builder | `tests/unit/` | `*.spec.ts` | `@playwright/test` | `unit` |
| an HTTP contract, status codes | `tests/api/` | `*.api.spec.ts` | `request` | `api` |
| a page renders, static content | `tests/ui/` | `*.ui.spec.ts` | `test` | `ui-chromium` |
| login, redirects, navigation | `tests/e2e/auth/` | `*.e2e.spec.ts` | `test` | `e2e-auth` |
| bootstrap data / save a session | `tests/e2e/setup/` | `*.e2e.spec.ts` | `authenticatedTest` | `e2e-setup-*` |
| a feature journey | `tests/e2e/modules/` | `*.e2e.spec.ts` | `scopedTest` | `e2e-modules` |
| anything touching a server-capped resource | `tests/e2e/serial/` | `*.e2e.spec.ts` | `scopedTest` | `e2e-serial` |
| what a restricted role can/can't do | `tests/e2e/rbac/` | `*.e2e.spec.ts` | `restrictedTest` | `e2e-rbac` |

Utilities, schemas and components are unit-tested elsewhere (Vitest/Jest). Playwright is
for journeys and UI smoke — never a unit-test substitute.

## Anatomy of a good spec

```ts
import { buildItemValues } from "../../../src/app/data/builders";
import { scopedTest } from "../../../src/app/fixtures/test-fixtures";

/** Needs: `add` on Items + the scoped (workspace-selected) session. */
scopedTest.describe("Item creation", () => {
  scopedTest("creates an item and finds it by search", async ({ itemsPage, itemFormPage }) => {
    const item = buildItemValues();            // unique per call

    await itemsPage.goto();
    await itemsPage.expectLoaded();
    await itemsPage.openCreateItem();

    await itemFormPage.createItem(item);
    await itemFormPage.expectSuccessToast();

    await itemsPage.expectItemVisible(item.name);
  });
});
```

- **Thin.** No locators, no `waitForResponse`, no copy strings in the spec — page objects
  and `app-config.ts` own those.
- **Unique data.** Builders append a random suffix and the `!E2E` prefix, so parallel
  workers and reruns don't collide and test data is easy to find and bulk-clean.
- **Document permissions.** State what the spec assumes (`Needs: add on Items`).
- **Skip, don't fail, on missing configuration** (`test.skip(!hasTestUserCredentials(), …)`).
  Fail loudly on a missing *setup* (a project that should have run).

## Adding a page object

1. **Copy** to `src/app/config/app-config.ts`: the route in `appPaths` and the visible copy in
   a `<thing>PageContent` object (headings, placeholders, toast text, button names).
2. **Matchers** in `src/app/api/matchers.ts`:
   `export const thingApi = createResourceMatchers("/api/things", { idPattern: "\\d+" });`
3. **Builder** in `src/app/data/builders.ts`: `buildThingValues(overrides = {})` using
   `uniqueName("Thing")`.
4. **Page class** in `src/app/pages/`:
   - list pages extend `DataTablePage`, form/detail pages extend `BasePage`;
   - public methods are intent (`createThing`, `expectThingVisible`), not clicks;
   - private getters hold locators.
5. **Register** it in the `pages` map in `src/app/fixtures/test-fixtures.ts`. That single
   line makes `thingPage` available as a fixture and in its type.

### Locators

Prefer, in order: `getByRole` (with name) → `getByLabel` → `getByPlaceholder` → `getByText`
scoped to a region → test id. Avoid CSS classes and XPath (one design-system refactor
breaks every spec). Scope to `getByRole("main")` when a label also appears in the sidebar
or header.

### Waiting

See the table in [02 — Architecture §7](02-architecture.md). In short: never
`waitForTimeout`; wait on a visible UI state or a response whose listener was attached
**before** the triggering action (`actAndWaitForResponse`).

> ProactiveMD's reference `patient-manager-page.ts` still sleeps for the search debounce
> (`PATIENT_SEARCH_DEBOUNCE_MS`). That predates `searchDataTable` — don't copy it.

## Test data and idempotence

- Every created record is unique (`uniqueName`, `buildPerson`, faker).
- Cross-spec data goes through the manifest, not through fixed names:
  `workspaceManifest.require("workspaceName")`.
- Make setup specs **idempotent** where the product allows it (look for an existing
  record first). ProactiveMD's purpose setup does this because purposes are fixed per client.
- Search for a record **only after** creating it. A query cache can serve a stale empty
  result for a search you ran before the record existed.

## Sessions and permissions

- Start from a saved session, don't log in per spec: `authenticatedTest` (login only),
  `scopedTest` (login + tenant), `restrictedTest` (non-superuser).
- Role-hidden navigation is *skippable*, not a failure. Assert that restricted actions are
  hidden/gated for the restricted role instead of asserting every route for every role.
- Need a different role? Add a name to `defineStorageStates`, a user to
  `createGlobalSetup` (or a setup spec like `restricted-user-login`), and a
  `storageStateContext` fixture. Nothing in `core` changes.

## Third parties (captcha, analytics, chat widgets)

Make the dependency deterministic instead of hoping it behaves:

```ts
import { blockTurnstileChallenge } from "../../src/core/support/network";

await blockTurnstileChallenge(page);          // BEFORE navigating
await registerPage.goto();
await registerPage.submit();
await registerPage.expectCaptchaError();      // deterministic error path
```

Use vendor "always passes" test keys on the isolated stack for the happy path, and
`waitForTurnstileToken(page)` before submitting.

## Review checklist

- [ ] Spec is in the right folder and file name
- [ ] No `waitForTimeout`, no `test.only`, no hard-coded shared record names
- [ ] Copy strings come from `app-config.ts`; locators live in a page object
- [ ] New page object registered in `test-fixtures.ts`
- [ ] Response listeners attached before the action
- [ ] Created data is unique; setup data goes through the manifest
- [ ] Needed permission documented; credential-gated paths `skip`
- [ ] `npm run typecheck` and the affected project pass locally
