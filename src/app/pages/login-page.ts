import { expect } from "@playwright/test";
import { LoginPage as CoreLoginPage } from "../../core/pages/login-page";
import { loginPageContent } from "../config/app-config";

/** Core credential form + this app's heading/title assertions. */
export class LoginPage extends CoreLoginPage {
  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: loginPageContent.heading })
    ).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async expectLoginPageTitle(): Promise<void> {
    await this.expectPageTitle(loginPageContent.pageTitlePattern);
  }

  async expectLoginError(message: string): Promise<void> {
    await expect(this.page.getByRole("alert")).toHaveText(message);
  }
}
