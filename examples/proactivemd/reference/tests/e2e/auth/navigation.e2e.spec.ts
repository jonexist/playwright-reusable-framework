import { expect } from "@playwright/test";
import { appPaths } from "../../../src/config/test-data";
import {
  authenticatedTest,
  hasTestUserCredentials,
} from "../../../src/fixtures/test-fixtures";
import { getManifestEntryByPath } from "../../../src/navigation/nav-routes";
import { AppShellPage } from "../../../src/pages/app-shell-page";
import { SidebarPage } from "../../../src/pages/sidebar-page";

authenticatedTest.describe.configure({ mode: "serial" });

authenticatedTest.describe("Sidebar navigation", () => {
  authenticatedTest.setTimeout(120_000);

  authenticatedTest(
    "navigates every RBAC-visible catalog route via sidebar",
    async ({ page }) => {
      authenticatedTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const sidebar = new SidebarPage(page);
      const shell = new AppShellPage(page);

      await page.goto(appPaths.missionControl);
      const visiblePaths = await sidebar.getVisibleCatalogHrefs();
      expect(visiblePaths.length).toBeGreaterThan(0);

      for (const path of visiblePaths) {
        const entry = getManifestEntryByPath(path);

        await authenticatedTest.step(
          `${entry?.itemTitle ?? path} (${path})`,
          async () => {
            await sidebar.navigateToPath(path);
            await shell.expectRouteLoaded(path);
          }
        );
      }
    }
  );
});
