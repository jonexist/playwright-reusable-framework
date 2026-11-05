import { expect, type Locator, Page } from "@playwright/test";
import type { E2ETenantManifest } from "../helpers/e2e-tenant-manifest";
import { BasePage } from "./base-page";

/** Budget for remount-safe fill retries via expect.toPass. */
const COMBOBOX_FILL_RETRY_MS = 15_000;

/**
 * Nested fill/toHaveValue timeouts inside toPass — keep short so retries are
 * not starved by the default actionTimeout (10s).
 */
const COMBOBOX_FILL_ACTION_MS = 1_000;
const COMBOBOX_FILL_ASSERT_MS = 500;

export class TopNavContextPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async selectClientAndLocation(manifest: E2ETenantManifest): Promise<void> {
    await this.selectClient(manifest.clientName);
    await this.expectClientSelected(manifest.clientName);
    await this.selectLocation(manifest.locationName);
  }

  async expectClientSelected(name: string): Promise<void> {
    await expect(this.clientCombobox).toContainText(name);
  }

  async expectLocationSelected(name: string): Promise<void> {
    await expect(this.locationCombobox).toContainText(name);
  }

  private get clientCombobox() {
    return this.page.getByRole("combobox").nth(0);
  }

  private get locationCombobox() {
    return this.page.getByRole("combobox").nth(1);
  }

  private async selectClient(clientName: string): Promise<void> {
    await this.selectTopNavCombobox({
      combobox: this.clientCombobox,
      searchPlaceholder: "Search by name or employer code",
      optionName: clientName,
    });
  }

  private async selectLocation(locationName: string): Promise<void> {
    await this.selectTopNavCombobox({
      combobox: this.locationCombobox,
      searchPlaceholder: "Search by name or code",
      optionName: locationName,
    });
  }

  /**
   * ApiCombobox remounts CommandInput when the tenant list refetches or search
   * debounce clears options. Re-open and re-fill on retry; assert on the option
   * rather than waitForResponse (React Query cache often skips the network).
   */
  private async selectTopNavCombobox(options: {
    combobox: Locator;
    searchPlaceholder: string;
    optionName: string;
  }): Promise<void> {
    const { combobox, searchPlaceholder, optionName } = options;
    const searchInput = this.page.getByPlaceholder(searchPlaceholder);
    const option = this.page
      .getByRole("option")
      .filter({ hasText: optionName })
      .first();

    await expect(combobox).toBeEnabled({ timeout: 10_000 });
    await combobox.click();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await expect(async () => {
      if (!(await searchInput.isVisible().catch(() => false))) {
        await combobox.click({ timeout: COMBOBOX_FILL_ACTION_MS });
        await expect(searchInput).toBeVisible({
          timeout: COMBOBOX_FILL_ACTION_MS,
        });
      }

      await searchInput.fill(optionName, { timeout: COMBOBOX_FILL_ACTION_MS });
      await expect(searchInput).toHaveValue(optionName, {
        timeout: COMBOBOX_FILL_ASSERT_MS,
      });
    }).toPass({ timeout: COMBOBOX_FILL_RETRY_MS });

    await expect(option).toBeVisible({ timeout: 15_000 });
    await option.click();
    await expect(combobox).toContainText(optionName, { timeout: 15_000 });
  }
}
