import { expect } from "@playwright/test";
import {
  accessDeniedContent,
  hasRestrictedUserCredentials,
  restrictedTest,
  restrictedUserAccess,
} from "../../../src/fixtures/test-fixtures";

// Role: view on /administration/roles only (e2e-restricted-user.json).
restrictedTest.describe("RBAC restricted navigation", () => {
  restrictedTest.setTimeout(120_000);

  restrictedTest.beforeEach(() => {
    restrictedTest.skip(
      !hasRestrictedUserCredentials(),
      "Set TEST_RESTRICTED_USER_EMAIL and TEST_RESTRICTED_USER_PASSWORD in .env"
    );
  });

  restrictedTest(
    "home redirects to the role's first permitted path",
    async ({ page, appShellPage }) => {
      await page.goto("/");
      await appShellPage.expectRouteLoaded(restrictedUserAccess.allowedPath);
    }
  );

  restrictedTest(
    "sidebar lists only the permitted catalog path",
    async ({ page, appShellPage, sidebarPage }) => {
      await page.goto(restrictedUserAccess.allowedPath);
      await appShellPage.expectRouteLoaded(restrictedUserAccess.allowedPath);

      const hrefs = await sidebarPage.getVisibleCatalogHrefs();
      expect(hrefs).toEqual([restrictedUserAccess.allowedPath]);
    }
  );

  restrictedTest(
    "direct link to a module without view permission shows Access Denied",
    async ({ page, appShellPage }) => {
      await page.goto(restrictedUserAccess.deniedViewPath);
      await appShellPage.expectAccessDenied(accessDeniedContent.viewMessage);
    }
  );
});
