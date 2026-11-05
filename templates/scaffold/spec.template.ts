// TEMPLATE — copy to tests/e2e/<tier>/<thing>-create.e2e.spec.ts.
//
// The folder decides the Playwright project (see playwright.config.ts):
//   auth/ | setup/ | modules/ | serial/ | rbac/        -> *.e2e.spec.ts
//   ui/ (*.ui.spec.ts) | api/ (*.api.spec.ts) | unit/
//
// Rules of thumb:
//   - Specs stay thin: locators and actions live in page objects.
//   - Unique faker data per run (build<Thing>Values) — no hard-coded shared fixtures.
//   - Document the permission the spec needs ("Needs: add on <module>").
//   - Wait on UI state or network, never waitForTimeout.
import { build<Thing>Values } from "../../../src/app/data/builders";
import { scopedTest } from "../../../src/app/fixtures/test-fixtures";

/** Needs: `add` permission on <module> + the scoped (workspace-selected) session. */
scopedTest.describe("<Thing> creation", () => {
  scopedTest("creates a <thing>", async ({ <thing>sPage, <thing>FormPage }) => {
    const <thing> = build<Thing>Values();

    await <thing>sPage.goto();
    await <thing>sPage.expectLoaded();

    await <thing>FormPage.goto();
    await <thing>FormPage.create<Thing>(<thing>);
    await <thing>FormPage.expectSuccessToast();

    await <thing>sPage.expect<Thing>Visible(<thing>.name);
  });
});
