import fs from "node:fs";
import path from "node:path";
import { loginAsRestrictedUser } from "../../../src/auth/auth-helper";
import { storageStatePaths } from "../../../src/auth/storage-state";
import {
  hasRestrictedUserCredentials,
  test,
} from "../../../src/fixtures/test-fixtures";

// Requires the user from seed-e2e-restricted-user.py (view-only Roles, not superuser).
test.describe("Restricted user session", () => {
  test.setTimeout(60_000);

  test("signs in the RBAC user and saves its storage state", async ({
    page,
  }) => {
    test.skip(
      !hasRestrictedUserCredentials(),
      "Set TEST_RESTRICTED_USER_EMAIL and TEST_RESTRICTED_USER_PASSWORD in .env"
    );

    fs.mkdirSync(path.dirname(storageStatePaths.restrictedUser), {
      recursive: true,
    });

    await loginAsRestrictedUser(page);
    await page
      .context()
      .storageState({ path: storageStatePaths.restrictedUser });
  });
});
