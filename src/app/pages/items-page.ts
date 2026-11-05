import { expect } from "@playwright/test";
import { DataTablePage } from "../../core/pages/data-table-page";
import { itemApi } from "../api/matchers";
import { appPaths, itemsPageContent } from "../config/app-config";

/** List page: search, Filters > Status, row actions. */
export class ItemsPage extends DataTablePage {
  async goto(): Promise<void> {
    await super.goto(appPaths.items);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: itemsPageContent.heading })
    ).toBeVisible({ timeout: 30_000 });
    await this.waitForDataTableReady();
  }

  async expectNoWorkspaceMessage(): Promise<void> {
    await expect(
      this.page.getByText(itemsPageContent.noWorkspaceMessage)
    ).toBeVisible();
  }

  async openCreateItem(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(new RegExp(`${appPaths.createItem}$`)),
      this.createLink.click(),
    ]);
  }

  async expectCreateLinkHidden(): Promise<void> {
    await expect(this.createLink).toHaveCount(0);
  }

  async expectItemVisible(name: string): Promise<void> {
    await this.search(name, { settleOnMatchingRow: true });
    await expect(this.rowByText(name)).toBeVisible();
  }

  async expectItemHidden(name: string): Promise<void> {
    await this.search(name);
    await expect(
      this.page.getByRole("row").filter({ hasText: name })
    ).toHaveCount(0);
  }

  async expectRowMenuUnavailable(name: string): Promise<void> {
    await this.search(name, { settleOnMatchingRow: true });
    await expect(
      this.rowByText(name).getByRole("button", { name: "Open menu" })
    ).toHaveCount(0);
  }

  async archiveItem(name: string): Promise<void> {
    await this.search(name, { settleOnMatchingRow: true });
    await this.clickRowMenuItem(this.rowByText(name), itemsPageContent.archiveAction);
    await expect(this.rowByText(name)).toContainText("archived");
  }

  async deleteItem(name: string): Promise<void> {
    await this.search(name, { settleOnMatchingRow: true });
    await this.clickRowMenuItem(this.rowByText(name), itemsPageContent.deleteAction);
    await this.expectToast(itemsPageContent.deleteSuccess);
  }

  /** Filters > Status > Active|Archived. */
  async applyStatusFilter(label: string): Promise<void> {
    await this.applyListFilter({
      submenuLabel: itemsPageContent.statusFilterSubmenu,
      optionLabel: label,
      isListResponse: itemApi.listWhere({ status: label.toLowerCase() }),
    });
  }

  private async search(
    query: string,
    options: { settleOnMatchingRow?: boolean } = {}
  ): Promise<void> {
    await this.searchDataTable({
      placeholder: itemsPageContent.searchPlaceholder,
      query,
      isSearchResponse: itemApi.listSearch(query),
      ...options,
    });
  }

  private get createLink() {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: itemsPageContent.createLink });
  }
}
