import { appPaths } from "../../../src/app/config/app-config";
import { buildItemValues } from "../../../src/app/data/builders";
import { scopedTest } from "../../../src/app/fixtures/test-fixtures";

/**
 * Starts from the scoped session (logged in + workspace selected), so the spec
 * contains only the behaviour under test. Unique data per run keeps parallel
 * workers and repeated runs from colliding.
 */
scopedTest.describe("Item creation", () => {
  scopedTest(
    "creates an item and finds it by search",
    async ({ page, itemsPage, itemFormPage }) => {
      const item = buildItemValues();

      await page.goto(appPaths.items);
      await itemsPage.expectLoaded();
      await itemsPage.openCreateItem();

      await itemFormPage.expectLoaded();
      await itemFormPage.createItem(item);
      await itemFormPage.expectSuccessToast();
      await itemFormPage.expectRedirectToList();

      await itemsPage.expectItemVisible(item.name);
    }
  );

  scopedTest("shows a required-field message on empty submit", async ({
    itemFormPage,
  }) => {
    await itemFormPage.goto();
    await itemFormPage.expectLoaded();
    await itemFormPage.submitEmpty();
    await itemFormPage.expectRequiredNameMessage();
  });
});
