import { expect } from "@playwright/test";
import { BasePage } from "../../core/pages/base-page";
import { workspaceApi } from "../api/matchers";
import { appPaths, workspaceFormContent } from "../config/app-config";
import type { WorkspaceFormValues } from "../data/builders";

export class WorkspaceFormPage extends BasePage {
  async goto(): Promise<void> {
    await super.goto(appPaths.createWorkspace);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: workspaceFormContent.heading })
    ).toBeVisible();
  }

  async createWorkspace(values: WorkspaceFormValues): Promise<void> {
    await this.page.getByLabel("Workspace name").fill(values.name);

    // Attach the response listener BEFORE the click that triggers it.
    await this.actAndWaitForResponse(
      () =>
        this.page
          .getByRole("button", { name: workspaceFormContent.saveButton })
          .click(),
      workspaceApi.create
    );
  }

  async submitEmpty(): Promise<void> {
    await this.page
      .getByRole("button", { name: workspaceFormContent.saveButton })
      .click();
  }

  async expectRequiredNameMessage(): Promise<void> {
    await expect(
      this.page.getByText(workspaceFormContent.requiredMessages.name)
    ).toBeVisible();
  }

  async expectSuccessToast(): Promise<void> {
    await this.expectToast(workspaceFormContent.successMessage);
  }
}
