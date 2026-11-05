import { restrictedTest } from "../../../src/app/fixtures/test-fixtures";

/**
 * Document the permissions each spec assumes. The restricted user can VIEW
 * items but cannot add/edit/delete. Prefer asserting that actions are hidden
 * or gated over asserting every route for every user.
 */
restrictedTest.describe("Read-only user", () => {
  restrictedTest("can view the list but not create items", async ({
    itemsPage,
  }) => {
    await itemsPage.goto();
    await itemsPage.expectLoaded();
    await itemsPage.expectCreateLinkHidden();
  });

  restrictedTest("is blocked from the create page", async ({
    itemFormPage,
  }) => {
    await itemFormPage.goto();
    await itemFormPage.expectAccessDenied();
  });
});
