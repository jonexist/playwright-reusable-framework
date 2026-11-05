import { expect } from "@playwright/test";
import { BasePage } from "../../core/pages/base-page";
import { workspaceFormContent } from "../config/app-config";

/**
 * Top-bar workspace picker (the demo's equivalent of ProactiveMD's
 * client/location "tenant context" combobox).
 */
export class WorkspacePickerPage extends BasePage {
  async selectWorkspace(name: string): Promise<void> {
    await this.selectComboboxOption({
      combobox: this.combobox,
      searchPlaceholder: workspaceFormContent.picker.searchPlaceholder,
      optionName: name,
    });
  }

  async expectSelected(name: string): Promise<void> {
    await expect(this.combobox).toContainText(name);
  }

  async expectNothingSelected(): Promise<void> {
    await expect(this.combobox).toHaveText(
      workspaceFormContent.picker.placeholder
    );
  }

  private get combobox() {
    return this.page.getByRole("combobox");
  }
}
