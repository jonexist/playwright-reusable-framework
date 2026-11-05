// TEMPLATE — copy to src/app/pages/<thing>-form-page.ts and replace <Thing>/<thing>.
// Then: register it in src/app/fixtures/test-fixtures.ts (`pages` map) and add
// its copy/paths to src/app/config/app-config.ts and matchers to src/app/api/matchers.ts.
import { expect } from "@playwright/test";
import { BasePage } from "../../core/pages/base-page";
import { <thing>Api } from "../api/matchers";
import { appPaths, <thing>FormContent } from "../config/app-config";
import type { <Thing>FormValues } from "../data/builders";

export class <Thing>FormPage extends BasePage {
  async goto(): Promise<void> {
    await super.goto(appPaths.create<Thing>);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: <thing>FormContent.heading })
    ).toBeVisible();
  }

  async create<Thing>(values: <Thing>FormValues): Promise<void> {
    // Role/label locators only. No CSS-class XPath, no waitForTimeout.
    await this.page.getByLabel("Name").fill(values.name);

    // Listener is attached BEFORE the click that triggers the request.
    await this.actAndWaitForResponse(
      () =>
        this.page
          .getByRole("button", { name: <thing>FormContent.saveButton })
          .click(),
      <thing>Api.create
    );
  }

  async expectSuccessToast(): Promise<void> {
    await this.expectToast(<thing>FormContent.successMessage);
  }
}
