import { Page } from "@playwright/test";
import { restrictedUserAccess, testUsers } from "../config/test-data";
import { LoginPage } from "../pages/login-page";

export async function loginThroughUI(
  page: Page,
  email: string,
  password: string,
  options: { expectedPath?: string } = {}
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.gotoLogin();
  await loginPage.login(email, password, options);
}

export async function loginAsDefaultUser(page: Page): Promise<void> {
  await loginThroughUI(
    page,
    testUsers.defaultUser.email,
    testUsers.defaultUser.password
  );
}

/** Scoped user lands on its only permitted path, not Mission Control. */
export async function loginAsRestrictedUser(page: Page): Promise<void> {
  await loginThroughUI(
    page,
    testUsers.restrictedUser.email,
    testUsers.restrictedUser.password,
    { expectedPath: restrictedUserAccess.allowedPath }
  );
}
