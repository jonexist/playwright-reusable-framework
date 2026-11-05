import { expect } from "@playwright/test";
import { BasePage } from "../../core/pages/base-page";
import { appPaths, claimPageContent } from "../config/app-config";

/** A page backed by a server-capped resource (one claim per user). */
export class ClaimPage extends BasePage {
  async goto(): Promise<void> {
    await super.goto(appPaths.claim);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: claimPageContent.heading })
    ).toBeVisible();
  }

  async claim(): Promise<void> {
    await this.page
      .getByRole("button", { name: claimPageContent.claimButton })
      .click();
    await this.expectToast(claimPageContent.claimedToast);
  }

  async release(): Promise<void> {
    await this.page
      .getByRole("button", { name: claimPageContent.releaseButton })
      .click();
    await this.expectToast(claimPageContent.releasedToast);
  }
}
