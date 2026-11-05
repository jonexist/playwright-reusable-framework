import { expect, type Page } from "@playwright/test";
import type { ResponseMatcher } from "../api/response-matchers";
import { env } from "../config/env";
import { ui } from "../config/ui-conventions";
import { BasePage } from "./base-page";

export type LoginOptions = {
  /**
   * Where this user lands after login. Scoped (RBAC) users usually land on
   * their role's first permitted page, not the default `POST_LOGIN_PATH`.
   */
  expectedPath?: string;
  /** Optional: wait for the credentials POST before waiting on navigation. */
  submitResponse?: ResponseMatcher;
  timeout?: number;
};

/** Credential form object. Subclass to add app-specific heading/links checks. */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLogin(path: string = env.LOGIN_PATH): Promise<void> {
    await this.goto(path);
  }

  async gotoHome(): Promise<void> {
    await this.goto("/");
  }

  async expectOnLoginPage(): Promise<void> {
    await this.expectUrl(new RegExp(`${escapeRegExp(env.LOGIN_PATH)}$`));
  }

  async expectOnLandingPage(path: string = env.POST_LOGIN_PATH): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(escapeRegExp(path)), {
      timeout: 30_000,
    });
  }

  /** Fills and submits without waiting for navigation — for negative tests. */
  async submitCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  /** Happy path: submit, then wait until the app lands where it should. */
  async login(
    email: string,
    password: string,
    options: LoginOptions = {}
  ): Promise<void> {
    const { submitResponse, timeout = 30_000 } = options;

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    const submission = submitResponse
      ? this.page.waitForResponse(submitResponse, { timeout })
      : undefined;

    await this.signInButton.click();
    await submission;
    await this.waitForPostLoginNavigation(options.expectedPath, timeout);
  }

  /** Surfaces the app's own login error instead of a bare URL timeout. */
  private async waitForPostLoginNavigation(
    expectedPath: string = env.POST_LOGIN_PATH,
    timeout: number
  ): Promise<void> {
    const accepted = [expectedPath, env.CHANGE_PASSWORD_PATH]
      .filter((p): p is string => Boolean(p))
      .map(escapeRegExp)
      .join("|");

    try {
      await this.page.waitForURL(new RegExp(accepted), { timeout });
    } catch {
      if (this.page.url().includes(env.LOGIN_PATH)) {
        const loginError = this.page
          .locator(ui.login.errorScope)
          .getByRole("alert");
        if (await loginError.isVisible()) {
          const message = (await loginError.textContent())?.trim();
          throw new Error(message || "Login failed with an unknown error.");
        }
      }

      throw new Error(
        `Expected redirect to ${expectedPath} but landed on ${this.page.url()}`
      );
    }
  }

  protected get emailInput() {
    return this.page.getByLabel(ui.login.emailLabel);
  }

  protected get passwordInput() {
    return this.page.getByLabel(ui.login.passwordLabel);
  }

  protected get signInButton() {
    return this.page.getByRole("button", { name: ui.login.submitButtonName });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
