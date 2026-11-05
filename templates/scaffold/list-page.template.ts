// TEMPLATE — copy to src/app/pages/<thing>-page.ts and replace <Thing>/<thing>.
// Extend DataTablePage for any searchable/filterable table.
import { expect } from "@playwright/test";
import { DataTablePage } from "../../core/pages/data-table-page";
import { <thing>Api } from "../api/matchers";
import { appPaths, <thing>PageContent } from "../config/app-config";

export class <Thing>Page extends DataTablePage {
  async goto(): Promise<void> {
    await super.goto(appPaths.<thing>s);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: <thing>PageContent.heading })
    ).toBeVisible({ timeout: 30_000 });
    await this.waitForDataTableReady();
  }

  async expect<Thing>Visible(name: string): Promise<void> {
    await this.searchDataTable({
      placeholder: <thing>PageContent.searchPlaceholder,
      query: name,
      isSearchResponse: <thing>Api.listSearch(name),
      settleOnMatchingRow: true, // only when asserting a row IS present
    });
    await expect(this.rowByText(name)).toBeVisible();
  }

  async delete<Thing>(name: string): Promise<void> {
    await this.clickRowMenuItem(this.rowByText(name), <thing>PageContent.deleteAction);
  }
}
