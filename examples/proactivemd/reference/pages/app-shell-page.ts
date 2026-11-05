import { expect, Page } from "@playwright/test";
import { accessDeniedContent } from "../config/test-data";
import { isSecondaryNavPath } from "../navigation/nav-routes";
import { BasePage } from "./base-page";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class AppShellPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectRouteLoaded(path: string): Promise<void> {
    const urlPattern = new RegExp(`${escapeRegex(path)}(?:\\?|#|$)`);

    await expect(this.page).toHaveURL(urlPattern, { timeout: 30_000 });
    await expect(
      this.page.getByRole("heading", { name: "Access Denied" })
    ).not.toBeVisible();
    await expect(this.page.locator('[data-sidebar="sidebar"]')).toBeVisible();
    await this.page.waitForLoadState("domcontentloaded");

    const sidebarLink = this.page.locator(
      `[data-sidebar="sidebar"] a[href="${path}"]`
    );
    await expect(sidebarLink).toBeVisible({ timeout: 10_000 });

    if (!isSecondaryNavPath(path)) {
      const activeLink = this.page.locator(
        `[data-sidebar="sidebar"] a[href="${path}"][aria-current="page"]`
      );
      await expect(activeLink).toBeVisible({ timeout: 10_000 });
    }
  }

  /** AppAccessGuard (view) and RbacActionGate (add/edit) share this card. */
  async expectAccessDenied(message: string): Promise<void> {
    await expect(
      this.page.getByRole("main").getByText(accessDeniedContent.heading, {
        exact: true,
      })
    ).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();
  }
}
