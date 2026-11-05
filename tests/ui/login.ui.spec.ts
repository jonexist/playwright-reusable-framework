import { test } from "../../src/app/fixtures/test-fixtures";

/** Fast smoke: renders and static content only. No credentials needed. */
test.describe("Login page UI", () => {
  test("login page loads with sign-in form", async ({ loginPage }) => {
    await loginPage.gotoLogin();
    await loginPage.expectLoginPageTitle();
    await loginPage.expectLoaded();
  });
});
