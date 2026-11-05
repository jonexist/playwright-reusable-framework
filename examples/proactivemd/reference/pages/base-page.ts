import { expect, type Locator, type Response, Page } from "@playwright/test";

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    // Prefer DOM ready over full "load" — Next/SPA shells often keep network busy.
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

  /**
   * Waits for Cloudflare Turnstile to auto-solve and write the token into
   * its hidden `cf-turnstile-token` input. Give the challenge script room
   * to load and run before asserting, since dummy "always passes" keys
   * still round-trip through Cloudflare's servers.
   */
  protected async waitForCaptchaToken(): Promise<void> {
    await expect(
      this.page.locator('input[name="cf-turnstile-token"]')
    ).not.toHaveValue("", { timeout: 15_000 });
  }

  /**
   * Waits for a list page's DataTable to finish its initial load using UI
   * state, not the network. A `waitForResponse` attached after navigation
   * misses a list GET that already finished (or was served from the React
   * Query cache), which used to burn its full 30s timeout on every call.
   * `ui/data-table.tsx` renders `.animate-pulse` skeleton rows while loading.
   */
  protected async waitForDataTableReady(timeout = 30_000): Promise<void> {
    const main = this.page.getByRole("main");
    await expect(main.getByText("Rows per page")).toBeVisible({ timeout });
    await expect(main.locator("tbody .animate-pulse")).toHaveCount(0, {
      timeout,
    });
  }

  /**
   * Types into a debounced DataTable search box and waits for the result to
   * render, instead of sleeping for the debounce and hoping the request has
   * finished. Heavy lists (biometrics, flu shots) can take well over 15s to
   * answer a search under parallel load.
   *
   * With `settleOnMatchingRow`, it also stops waiting once a row containing
   * the query shows — a React Query cache hit for this search key renders
   * without a network request, so waiting on the response alone would burn
   * the whole timeout. Leave it off when asserting a row is absent.
   *
   * The row shortcut only applies when that row was NOT already on screen
   * before typing. If it was (e.g. a just-created record on the unfiltered
   * list), it would "settle" instantly, and the debounced search firing
   * afterwards would re-render the table under the next action — closing an
   * open row menu mid-click.
   */
  protected async searchDataTable(options: {
    placeholder: string;
    query: string;
    isSearchResponse: (response: Response) => boolean;
    settleOnMatchingRow?: boolean;
    timeout?: number;
  }): Promise<void> {
    const {
      placeholder,
      query,
      isSearchResponse,
      settleOnMatchingRow = false,
      timeout = 45_000,
    } = options;
    const searchInput = this.page.getByPlaceholder(placeholder);

    if ((await searchInput.inputValue()) !== query) {
      const matchingRow = this.page
        .getByRole("row")
        .filter({ hasText: query })
        .first();
      const rowAlreadyShown = await matchingRow.isVisible().catch(() => false);

      const waits: Promise<unknown>[] = [
        this.page.waitForResponse(isSearchResponse, { timeout }),
      ];
      if (settleOnMatchingRow && !rowAlreadyShown) {
        waits.push(matchingRow.waitFor({ timeout }));
      }
      // Promise.race subscribes to every wait, so the loser's later
      // rejection is handled; the catch covers both timing out.
      const settled = Promise.race(waits).catch(() => undefined);
      await searchInput.fill(query);
      await settled;
    }

    await this.waitForDataTableReady(timeout);
  }

  /**
   * Opens a DataTable row's actions menu and clicks one item, retrying both
   * as one unit. A list refetch that lands mid-action re-renders the row and
   * closes its Radix dropdown, so a one-shot "open, then click item" can end
   * up waiting on a menu item that no longer exists.
   */
  protected async clickRowMenuItem(
    row: Locator,
    itemName: string,
    openMenuLabel = "Open menu"
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
   * FilterGroup dropdown: Filters button → submenu → checkbox option.
   * Radix submenus open more reliably on hover than click.
   */
  protected async applyListFilter(options: {
    submenuLabel: string | RegExp;
    optionLabel: string;
    isListResponse?: (response: Response) => boolean;
  }): Promise<void> {
    const { submenuLabel, optionLabel, isListResponse } = options;

    await this.page.getByRole("button", { name: /^Filters/ }).click();

    const submenu = this.page.getByRole("menuitem", { name: submenuLabel });
    await expect(submenu).toBeVisible({ timeout: 10_000 });
    await submenu.hover();

    const option = this.page.getByRole("menuitemcheckbox", {
      name: optionLabel,
      exact: true,
    });
    await expect(option).toBeVisible({ timeout: 10_000 });

    const alreadyChecked =
      (await option.getAttribute("data-state")) === "checked" ||
      (await option.getAttribute("aria-checked")) === "true";
    if (alreadyChecked) {
      await this.page.keyboard.press("Escape");
      return;
    }

    const listResponse = isListResponse
      ? this.page
          .waitForResponse(isListResponse, { timeout: 15_000 })
          .catch(() => undefined)
      : Promise.resolve(undefined);

    await option.click();
    await listResponse;
    await this.page.keyboard.press("Escape");
  }

  /**
   * FilterGroup dropdown for a `type: "text"` filter: Filters button →
   * submenu → the Input revealed in that submenu's content. Unlike the top
   * search box, text filters are NOT debounced (FilterGroup calls `setFilter`
   * directly on every keystroke), so fill the final value and wait on the
   * response matching it rather than relying on a debounce window.
   */
  protected async applyTextListFilter(options: {
    submenuLabel: string | RegExp;
    placeholder: string;
    value: string;
    isListResponse?: (response: Response) => boolean;
  }): Promise<void> {
    const { submenuLabel, placeholder, value, isListResponse } = options;

    await this.page.getByRole("button", { name: /^Filters/ }).click();

    const submenu = this.page.getByRole("menuitem", { name: submenuLabel });
    await expect(submenu).toBeVisible({ timeout: 10_000 });
    await submenu.hover();

    const input = this.page.getByPlaceholder(placeholder);
    await expect(input).toBeVisible({ timeout: 10_000 });

    const listResponse = isListResponse
      ? this.page
          .waitForResponse(isListResponse, { timeout: 15_000 })
          .catch(() => undefined)
      : Promise.resolve(undefined);

    await input.fill(value);
    await listResponse;
    await this.page.keyboard.press("Escape");
  }
}
