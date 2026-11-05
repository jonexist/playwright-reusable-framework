import { hasTestUserCredentials, test } from "../../../src/fixtures/test-fixtures";
import { loginAsDefaultUser } from "../../../src/auth/auth-helper";

test.describe("Login E2E", () => {
  test("redirects unauthenticated users from home to login", async ({
    loginPage,
  }) => {
    await loginPage.gotoHome();
    await loginPage.expectOnLoginPage();
  });

  test("user can sign in with email and password", async ({
    loginPage,
    page,
  }) => {
    test.skip(
      !hasTestUserCredentials(),
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
    );

    await loginAsDefaultUser(page);
    await loginPage.expectOnMissionControl();
  });
});
