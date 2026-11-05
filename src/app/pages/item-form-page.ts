import { expect } from "@playwright/test";
import { BasePage } from "../../core/pages/base-page";
import { itemApi } from "../api/matchers";
import {
  accessDeniedContent,
  appPaths,
  itemFormContent,
} from "../config/app-config";
import type { ItemFormValues } from "../data/builders";

export class ItemFormPage extends BasePage {
  async goto(): Promise<void> {
    await super.goto(appPaths.createItem);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: itemFormContent.heading })
    ).toBeVisible();
  }

  async createItem(values: ItemFormValues): Promise<void> {
    await this.page.getByLabel("Item name").fill(values.name);
    await this.page.getByLabel("Description").fill(values.description);

    await this.actAndWaitForResponse(() => this.save(), itemApi.create);
  }

  async submitEmpty(): Promise<void> {
    await this.save();
  }

  async expectRequiredNameMessage(): Promise<void> {
    await expect(
      this.page.getByText(itemFormContent.requiredMessages.name)
    ).toBeVisible();
  }

  async expectSuccessToast(): Promise<void> {
    await this.expectToast(itemFormContent.successMessage);
  }

  async expectRedirectToList(): Promise<void> {
    await this.expectUrl(new RegExp(`${appPaths.items}$`), { timeout: 15_000 });
  }

  /** What a role without `add` permission sees instead of the form. */
  async expectAccessDenied(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: accessDeniedContent.heading })
    ).toBeVisible();
    await expect(
      this.page.getByText(accessDeniedContent.addMessage)
    ).toBeVisible();
  }

  private save() {
    return this.page
      .getByRole("button", { name: itemFormContent.saveButton })
      .click();
  }
}
