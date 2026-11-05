import type { Page } from "@playwright/test";
import { LoginPage, type LoginOptions } from "../pages/login-page";

export type Credentials = { email: string; password: string };

/**
 * Logs in through the real UI. `LoginPage` can be swapped for an app subclass
 * (heading checks, captcha waits, custom submit matcher) via `loginPage`.
 */
export async function loginThroughUI(
  page: Page,
  credentials: Credentials,
  options: LoginOptions & { loginPage?: LoginPage } = {}
): Promise<void> {
  const { loginPage = new LoginPage(page), ...loginOptions } = options;

  await loginPage.gotoLogin();
  await loginPage.login(credentials.email, credentials.password, loginOptions);
}
