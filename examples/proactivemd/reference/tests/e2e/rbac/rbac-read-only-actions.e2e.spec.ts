import {
  accessDeniedContent,
  hasRestrictedUserCredentials,
  restrictedTest,
  restrictedUserAccess,
} from "../../../src/fixtures/test-fixtures";
import { appPaths } from "../../../src/config/test-data";

// Role: view on /administration/roles only (e2e-restricted-user.json).
restrictedTest.describe("RBAC read-only actions", () => {
  restrictedTest.setTimeout(120_000);

  restrictedTest.beforeEach(() => {
    restrictedTest.skip(
      !hasRestrictedUserCredentials(),
      "Set TEST_RESTRICTED_USER_EMAIL and TEST_RESTRICTED_USER_PASSWORD in .env"
    );
  });

  restrictedTest(
    "roles list hides create, edit and delete controls",
    async ({ roleManagerPage }) => {
      await roleManagerPage.goto();
      await roleManagerPage.expectLoadedReadOnly();
      await roleManagerPage.expectRowReadOnly(restrictedUserAccess.roleName);
    }
  );

  restrictedTest(
    "direct link to the create page is blocked without add permission",
    async ({ page, appShellPage }) => {
      await page.goto(appPaths.createRole);
      await appShellPage.expectAccessDenied(accessDeniedContent.addMessage);
    }
  );

  restrictedTest(
    "direct link to the edit page is blocked without edit permission",
    async ({ page, appShellPage }) => {
      await page.goto(restrictedUserAccess.editRolePath);
      await appShellPage.expectAccessDenied(accessDeniedContent.editMessage);
    }
  );
});
