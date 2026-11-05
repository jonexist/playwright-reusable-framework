import { expect, type Locator, type Response } from "@playwright/test";
import type { ResponseMatcher } from "../api/response-matchers";
import { ui } from "../config/ui-conventions";
import { BasePage } from "./base-page";

/**
 * Helpers for list pages built on a searchable/filterable data table
 * (shadcn/Radix style: debounced search box, "Filters" dropdown with
 * submenus, per-row "Open menu" actions).
 *
 * Extend this for each list page and keep the app-specific bits (URLs,
 * headings, placeholders) in the subclass. Every wait is UI- or
 * network-driven — never `waitForTimeout`.
 */
export abstract class DataTablePage extends BasePage {
  /**
   * Waits for the table's initial load using UI state, not the network.
   * A `waitForResponse` attached after navigation misses a list GET that
   * already finished (or was served from a query cache) and burns its whole
   * timeout; skeleton rows are a reliable signal instead.
   */
  protected async waitForDataTableReady(
    timeout = ui.timeouts.dataTableMs
  ): Promise<void> {
    const main = this.page.getByRole("main");
    await expect(main.getByText(ui.dataTable.readyText)).toBeVisible({
      timeout,
    });
    await expect(main.locator(ui.dataTable.skeletonSelector)).toHaveCount(0, {
      timeout,
    });
  }

  /** Row containing `text` (first match). */
  protected rowByText(text: string): Locator {
    return this.page.getByRole("row").filter({ hasText: text }).first();
  }

  /**
   * Types into a debounced search box and waits for the result to render
   * instead of sleeping for the debounce and hoping the request finished.
   *
   * `settleOnMatchingRow` also stops waiting once a row containing the query
   * shows (a cache hit renders without a request). It only applies when that
   * row was NOT already visible before typing — otherwise it would "settle"
   * instantly and the debounced search would re-render the table under your
   * next action. Leave it off when asserting a row is absent.
   */
  protected async searchDataTable(options: {
    placeholder: string;
    query: string;
    isSearchResponse: ResponseMatcher;
    settleOnMatchingRow?: boolean;
    timeout?: number;
  }): Promise<void> {
    const {
      placeholder,
      query,
      isSearchResponse,
      settleOnMatchingRow = false,
      timeout = ui.timeouts.searchMs,
    } = options;
    const searchInput = this.page.getByPlaceholder(placeholder);

    if ((await searchInput.inputValue()) !== query) {
      const matchingRow = this.rowByText(query);
      const rowAlreadyShown = await matchingRow.isVisible().catch(() => false);

      const waits: Promise<unknown>[] = [
        this.page.waitForResponse(isSearchResponse, { timeout }),
      ];
      if (settleOnMatchingRow && !rowAlreadyShown) {
        waits.push(matchingRow.waitFor({ timeout }));
      }

      // Promise.race subscribes to every wait, so the loser's later rejection
      // is handled; the catch covers both timing out.
      const settled = Promise.race(waits).catch(() => undefined);
      await searchInput.fill(query);
      await settled;
    }

    await this.waitForDataTableReady(timeout);
  }

  /**
   * Opens a row's actions menu and clicks one item, retrying both as one
   * unit. A list refetch that lands mid-action re-renders the row and closes
   * its dropdown, so a one-shot "open, then click item" can end up waiting on
   * a menu item that no longer exists.
   */
  protected async clickRowMenuItem(
    row: Locator,
    itemName: string,
    openMenuLabel: string = ui.dataTable.rowMenuButtonName
  ): Promise<void> {
    const item = this.page.getByRole("menuitem", {
      name: itemName,
      exact: true,
    });

    await expect(async () => {
      if (!(await item.isVisible().catch(() => false))) {
        await row
          .getByRole("button", { name: openMenuLabel })
          .click({ timeout: 5_000 });
      }
      await item.click({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
  }

  /**
   * Filters button → submenu → checkbox option. Radix submenus open more
   * reliably on hover than on click. Idempotent: an already-checked option is
   * left alone.
   */
  protected async applyListFilter(options: {
    submenuLabel: string | RegExp;
    optionLabel: string;
    isListResponse?: (response: Response) => boolean;
  }): Promise<void> {
    const { submenuLabel, optionLabel, isListResponse } = options;

    await this.page.getByRole("button", { name: ui.filters.buttonName }).click();

    const submenu = this.page.getByRole("menuitem", { name: submenuLabel });
    await expect(submenu).toBeVisible({ timeout: ui.timeouts.menuMs });
    await submenu.hover();

    const option = this.page.getByRole("menuitemcheckbox", {
      name: optionLabel,
      exact: true,
    });
    await expect(option).toBeVisible({ timeout: ui.timeouts.menuMs });

    const alreadyChecked =
      (await option.getAttribute("data-state")) === "checked" ||
      (await option.getAttribute("aria-checked")) === "true";
    if (alreadyChecked) {
      await this.page.keyboard.press("Escape");
      return;
    }

    const listResponse = isListResponse
      ? this.page
          .waitForResponse(isListResponse, {
            timeout: ui.timeouts.listResponseMs,
          })
          .catch(() => undefined)
      : Promise.resolve(undefined);

    await option.click();
    await listResponse;
    await this.page.keyboard.press("Escape");
  }

  /**
   * Filters button → submenu → text input revealed in that submenu.
   * Text filters are usually NOT debounced (one request per keystroke), so
   * fill the final value and wait on the response matching it.
   */
  protected async applyTextListFilter(options: {
    submenuLabel: string | RegExp;
    placeholder: string;
    value: string;
    isListResponse?: (response: Response) => boolean;
  }): Promise<void> {
    const { submenuLabel, placeholder, value, isListResponse } = options;

    await this.page.getByRole("button", { name: ui.filters.buttonName }).click();

    const submenu = this.page.getByRole("menuitem", { name: submenuLabel });
    await expect(submenu).toBeVisible({ timeout: ui.timeouts.menuMs });
    await submenu.hover();

    const input = this.page.getByPlaceholder(placeholder);
    await expect(input).toBeVisible({ timeout: ui.timeouts.menuMs });

    const listResponse = isListResponse
      ? this.page
          .waitForResponse(isListResponse, {
            timeout: ui.timeouts.listResponseMs,
          })
          .catch(() => undefined)
      : Promise.resolve(undefined);

    await input.fill(value);
    await listResponse;
    await this.page.keyboard.press("Escape");
  }
}
