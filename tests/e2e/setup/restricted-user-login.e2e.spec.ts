import {
  hasRestrictedUserCredentials,
  restrictedUserAccess,
  testUsers,
} from "../../../src/app/config/app-config";
import { storageStatePaths } from "../../../src/app/auth/storage-states";
import { test } from "../../../src/app/fixtures/test-fixtures";
import { loginThroughUI } from "../../../src/core/auth/auth-helper";

/**
 * Logs in the seeded non-superuser and saves its session for the RBAC tier.
 * Independent of the workspace chain: the restricted user needs no tenant.
 */
test.describe("Restricted user setup", () => {
  test("logs in and saves the restricted session", async ({
    page,
    context,
    loginPage,
  }) => {
    test.skip(
      !hasRestrictedUserCredentials(),
      "Set TEST_RESTRICTED_USER_EMAIL and TEST_RESTRICTED_USER_PASSWORD in .env"
    );

    // A scoped user lands on its first permitted page, not the default landing.
    await loginThroughUI(
      page,
      {
        email: testUsers.restrictedUser.email,
        password: testUsers.restrictedUser.password,
      },
      { expectedPath: restrictedUserAccess.allowedPath, loginPage }
    );

    await context.storageState({ path: storageStatePaths.restrictedUser });
  });
});
