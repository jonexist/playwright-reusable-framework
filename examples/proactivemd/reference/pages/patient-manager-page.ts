import { expect, Page } from "@playwright/test";
import {
  isPatientListActiveResponse,
  isPatientListResponse,
  isPatientUpdateResponse,
} from "../api/api-matchers";
import {
  appPaths,
  patientManagerPageContent,
} from "../config/test-data";
import { BasePage } from "./base-page";

/** FilterGroup debounces search input before firing the list request. */
const PATIENT_SEARCH_DEBOUNCE_MS = 600;

export class PatientManagerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto(appPaths.patients);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: patientManagerPageContent.heading,
      })
    ).toBeVisible({ timeout: 30_000 });

    await this.waitForPatientList();
    await expect(this.createPatientLink).toBeVisible({ timeout: 15_000 });
  }

  async openCreatePatient(): Promise<void> {
    const createUrl = new RegExp(`${appPaths.createPatient}$`);

    await this.createPatientLink.scrollIntoViewIfNeeded();
    await Promise.all([
      this.page.waitForURL(createUrl, { timeout: 30_000 }),
      this.createPatientLink.click(),
    ]);
  }

  async expectPatientVisible(fullName: string): Promise<void> {
    await this.searchPatients(fullName);
    await expect(this.patientRow(fullName)).toBeVisible({ timeout: 15_000 });
  }

  async expectPatientHidden(fullName: string): Promise<void> {
    await this.searchPatients(fullName);
    await expect(
      this.page.getByRole("row").filter({ hasText: fullName })
    ).toHaveCount(0, { timeout: 15_000 });
  }

  async expectInactiveBadge(fullName: string): Promise<void> {
    await this.searchPatients(fullName);
    const row = this.patientRow(fullName);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(
      row.getByText(patientManagerPageContent.inactiveBadge, { exact: true })
    ).toBeVisible();
  }

  async expectProfileLoaded(fullName: string): Promise<void> {
    await expect(this.page).toHaveURL(
      /\/practice-management\/patients\/\d+\/?$/,
      { timeout: 30_000 }
    );
    await expect(
      this.page.getByRole("heading", { name: fullName })
    ).toBeVisible({ timeout: 15_000 });
  }

  async openViewDetails(fullName: string): Promise<void> {
    await this.openRowMenu(fullName);
    await Promise.all([
      this.page.waitForURL(/\/practice-management\/patients\/\d+\/?$/, {
        timeout: 30_000,
      }),
      this.page
        .getByRole("menuitem", {
          name: patientManagerPageContent.viewDetailsAction,
        })
        .click(),
    ]);
  }

  async openEditFromProfile(): Promise<void> {
    const editLink = this.page.getByRole("link", {
      name: patientManagerPageContent.editPatientLink,
    });
    await expect(editLink).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      this.page.waitForURL(/\/practice-management\/patients\/edit\/\d+\/?$/, {
        timeout: 30_000,
      }),
      editLink.click(),
    ]);
  }

  async deactivatePatient(fullName: string): Promise<void> {
    await this.openRowMenu(fullName);
    await this.page
      .getByRole("button", {
        name: patientManagerPageContent.deactivateAction,
        exact: true,
      })
      .click();

    const dialog = this.page.getByRole("alertdialog", {
      name: patientManagerPageContent.deactivateDialogTitle,
    });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const updateResponse = this.page.waitForResponse(isPatientUpdateResponse, {
      timeout: 30_000,
    });
    await dialog
      .getByRole("button", {
        name: patientManagerPageContent.deactivateAction,
        exact: true,
      })
      .click();
    await updateResponse;

    await expect(
      this.page.getByText(patientManagerPageContent.deactivateSuccess)
    ).toBeVisible({ timeout: 15_000 });
  }

  /**
   * FilterGroup boolean Status: one click on Active or Inactive.
   * Do not uncheck the other option first — that remounts the Radix menu.
   * Success is the table, not aria-checked on a checkbox that may detach.
   */
  async applyActiveFilter(label: string): Promise<void> {
    const isActive = label === patientManagerPageContent.activeFilter;

    await this.applyListFilter({
      submenuLabel: patientManagerPageContent.statusFilterSubmenu,
      optionLabel: label,
      isListResponse: (response) =>
        isPatientListActiveResponse(response, isActive),
    });
  }

  private async openRowMenu(fullName: string): Promise<void> {
    const row = this.patientRow(fullName);
    if (!(await row.isVisible().catch(() => false))) {
      await this.searchPatients(fullName);
    }

    await expect(row).toBeVisible({ timeout: 15_000 });
    await row
      .getByRole("button", {
        name: patientManagerPageContent.openMenuLabel,
      })
      .click();
  }

  private patientRow(fullName: string) {
    return this.page.getByRole("row").filter({ hasText: fullName }).first();
  }

  private async searchPatients(query: string): Promise<void> {
    const searchInput = this.page.getByPlaceholder(
      patientManagerPageContent.searchPlaceholder
    );

    // React Query cache hits may skip a network search request.
    await searchInput.fill(query);
    await this.page.waitForTimeout(PATIENT_SEARCH_DEBOUNCE_MS);
  }

  private get createPatientLink() {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: patientManagerPageContent.createPatientLink });
  }

  private async waitForPatientList(): Promise<void> {
    await this.waitForDataTableReady();
  }
}
