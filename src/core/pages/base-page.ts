import { expect, type Locator, type Page, type Response } from "@playwright/test";
import type { ResponseMatcher } from "../api/response-matchers";
import { ui } from "../config/ui-conventions";

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    // Prefer DOM ready over full "load": SPA shells often keep the network busy.
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async expectUrl(
    pathPattern: RegExp,
    options?: { timeout?: number }
  ): Promise<void> {
    await expect(this.page).toHaveURL(pathPattern, options);
  }

  async expectPageTitle(titlePattern: RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(titlePattern);
  }

  /** Toast/snackbar assertion by visible text (exact substring match). */
  async expectToast(text: string | RegExp, timeout = 15_000): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible({ timeout });
  }

  /**
   * Starts listening for a response BEFORE the action runs, then returns it.
   * Avoids the classic race where `waitForResponse` is attached after the
   * request already finished.
   */
  protected async actAndWaitForResponse(
    action: () => Promise<unknown>,
    matcher: ResponseMatcher,
    timeout = ui.timeouts.listResponseMs
  ): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(matcher, { timeout }),
      action(),
    ]);

    return response;
  }

  /**
   * Opens an ARIA combobox, types into its search box and picks the option.
   *
   * Remount-safe: async comboboxes re-render their search input when options
   * refetch, so the open + fill step is retried as one unit and success is
   * asserted on the option, not on a network response (a cached query may
   * never hit the network).
   */
  protected async selectComboboxOption(options: {
    combobox: Locator;
    searchPlaceholder: string;
    optionName: string;
    openTimeoutMs?: number;
    retryBudgetMs?: number;
  }): Promise<void> {
    const {
      combobox,
      searchPlaceholder,
      optionName,
      openTimeoutMs = 10_000,
      retryBudgetMs = 15_000,
    } = options;
    const searchInput = this.page.getByPlaceholder(searchPlaceholder);
    const option = this.page
      .getByRole("option")
      .filter({ hasText: optionName })
      .first();

    await expect(combobox).toBeEnabled({ timeout: openTimeoutMs });
    await combobox.click();
    await expect(searchInput).toBeVisible({ timeout: openTimeoutMs });

    // Keep nested timeouts short so retries are not starved by actionTimeout.
    await expect(async () => {
      if (!(await searchInput.isVisible().catch(() => false))) {
        await combobox.click({ timeout: 1_000 });
        await expect(searchInput).toBeVisible({ timeout: 1_000 });
      }

      await searchInput.fill(optionName, { timeout: 1_000 });
      await expect(searchInput).toHaveValue(optionName, { timeout: 500 });
    }).toPass({ timeout: retryBudgetMs });

    await expect(option).toBeVisible({ timeout: retryBudgetMs });
    await option.click();
    await expect(combobox).toContainText(optionName, { timeout: retryBudgetMs });
  }
}
