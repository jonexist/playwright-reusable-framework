import {
  loginPageContent,
  testUsers,
} from "../../../src/app/config/app-config";
import {
  hasTestUserCredentials,
  test,
} from "../../../src/app/fixtures/test-fixtures";
import { loginThroughUI } from "../../../src/core/auth/auth-helper";

test.describe("Login E2E", () => {
  test("redirects unauthenticated users from home to login", async ({
    loginPage,
  }) => {
    await loginPage.gotoHome();
    await loginPage.expectOnLoginPage();
  });

  test("shows an error for invalid credentials", async ({ loginPage }) => {
    await loginPage.gotoLogin();
    await loginPage.submitCredentials("nobody@example.com", "wrong-password");
    await loginPage.expectLoginError(loginPageContent.invalidCredentialsError);
  });

  test("user can sign in with email and password", async ({
    loginPage,
    page,
  }) => {
    test.skip(
      !hasTestUserCredentials(),
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
    );

    await loginThroughUI(page, {
      email: testUsers.defaultUser.email,
      password: testUsers.defaultUser.password,
    });
    await loginPage.expectOnLandingPage();
  });
});
