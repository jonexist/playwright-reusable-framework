import { expect, Page } from "@playwright/test";
import { appPaths, loginPageContent } from "../config/test-data";
import { BasePage } from "./base-page";

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLogin(path = appPaths.login): Promise<void> {
    await this.goto(path);
  }

  async gotoHome(): Promise<void> {
    await this.goto("/");
  }

  async expectOnLoginPage(): Promise<void> {
    await this.expectUrl(new RegExp(`${appPaths.login}$`));
  }

  async expectOnMissionControl(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(appPaths.missionControl), {
      timeout: 30_000,
    });
  }

  async login(
    email: string,
    password: string,
    options: { expectedPath?: string } = {}
  ): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    const loginSubmission = this.page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname.endsWith(appPaths.login),
      { timeout: 30_000 }
    );

    await this.signInButton.click();
    await loginSubmission;
    await this.waitForPostLoginNavigation(options.expectedPath);
  }

  /**
   * Scoped (RBAC) users land on their role's first permitted path instead of
   * Mission Control (see resolvePostLoginPathFromUser), so callers pass it.
   */
  private async waitForPostLoginNavigation(
    expectedPath: string = appPaths.missionControl
  ): Promise<void> {
    const postLoginPathPattern = new RegExp(
      `${expectedPath}|${appPaths.changePassword}`
    );

    try {
      await this.page.waitForURL(postLoginPathPattern, { timeout: 30_000 });
    } catch {
      if (this.page.url().includes(appPaths.login)) {
        const loginError = this.page.locator("form").getByRole("alert");
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

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: loginPageContent.heading })
    ).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async expectNavigationLinks(): Promise<void> {
    await expect(
      this.page.getByRole("link", { name: loginPageContent.microsoftLink })
    ).toBeVisible();
    await expect(
      this.page.getByRole("link", { name: loginPageContent.registerLink })
    ).toBeVisible();
    await expect(
      this.page.getByRole("link", {
        name: loginPageContent.forgotPasswordLink,
      })
    ).toBeVisible();
  }

  async expectLoginPageTitle(): Promise<void> {
    await super.expectPageTitle(loginPageContent.pageTitlePattern);
  }

  private get emailInput() {
    return this.page.getByLabel("Email");
  }

  private get passwordInput() {
    return this.page.getByLabel("Password");
  }

  private get signInButton() {
    return this.page.getByRole("button", {
      name: loginPageContent.signInButton,
    });
  }
}
