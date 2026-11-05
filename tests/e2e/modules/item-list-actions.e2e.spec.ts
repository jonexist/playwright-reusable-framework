import { itemsPageContent } from "../../../src/app/config/app-config";
import { buildItemValues } from "../../../src/app/data/builders";
import {
  authenticatedTest,
  scopedTest,
} from "../../../src/app/fixtures/test-fixtures";

/**
 * Covers the data-table helpers end to end: debounced search, the row
 * actions menu and the Filters > Status submenu.
 */
scopedTest.describe("Item list actions", () => {
  scopedTest(
    "archives an item and filters the list by status",
    async ({ page, itemsPage, itemFormPage }) => {
      const kept = buildItemValues();
      const archived = buildItemValues();

      for (const item of [kept, archived]) {
        await itemFormPage.goto();
        await itemFormPage.createItem(item);
        await itemFormPage.expectRedirectToList();
      }

      await itemsPage.expectLoaded();
      await itemsPage.archiveItem(archived.name);

      await page.reload();
      await itemsPage.expectLoaded();
      await itemsPage.applyStatusFilter(itemsPageContent.archivedFilter);
      await itemsPage.expectItemVisible(archived.name);
      await itemsPage.expectItemHidden(kept.name);
    }
  );

  scopedTest("deletes an item", async ({ itemsPage, itemFormPage }) => {
    const item = buildItemValues();

    await itemFormPage.goto();
    await itemFormPage.createItem(item);
    await itemFormPage.expectRedirectToList();

    await itemsPage.expectLoaded();
    await itemsPage.deleteItem(item.name);
    await itemsPage.expectItemHidden(item.name);
  });
});

/** `authenticatedTest` = logged in but WITHOUT the workspace cookie. */
authenticatedTest.describe("Item list without a workspace", () => {
  authenticatedTest("asks the user to pick a workspace first", async ({
    itemsPage,
  }) => {
    await itemsPage.goto();
    await itemsPage.expectNoWorkspaceMessage();
  });
});
