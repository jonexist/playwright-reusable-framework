import { test } from "../../src/fixtures/test-fixtures";

test.describe("Login page UI", () => {
  test("login page loads with sign-in form", async ({ loginPage }) => {
    await loginPage.gotoLogin();
    await loginPage.expectLoginPageTitle();
    await loginPage.expectLoaded();
  });

  test("login page shows navigation links", async ({ loginPage }) => {
    await loginPage.gotoLogin();
    await loginPage.expectNavigationLinks();
  });
});
