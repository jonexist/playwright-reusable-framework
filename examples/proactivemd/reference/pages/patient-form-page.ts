import { expect, Locator, Page } from "@playwright/test";
import {
  isPatientCreateResponse,
  isPatientUpdateResponse,
} from "../api/api-matchers";
import {
  appPaths,
  patientFormContent,
  type PatientFormTestData,
} from "../config/test-data";
import { BasePage } from "./base-page";

export class PatientFormPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: patientFormContent.heading })
    ).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  async expectEditLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: patientFormContent.editHeading })
    ).toBeVisible({ timeout: 30_000 });
    await expect(this.updateButton).toBeVisible();
  }

  async expectTenantPrefilled(
    clientName: string,
    locationName: string
  ): Promise<void> {
    const clientSection = this.clientInformationSection();

    await expect(clientSection.getByRole("combobox").nth(0)).toContainText(
      clientName,
      { timeout: 15_000 }
    );
    await expect(clientSection.getByRole("combobox").nth(1)).toContainText(
      locationName,
      { timeout: 15_000 }
    );
  }

  async fillPatientInformation(data: PatientFormTestData): Promise<void> {
    const section = this.patientInformationSection();
    await section.scrollIntoViewIfNeeded();

    await this.fillTextbox(section, /^First Name/, data.firstName);
    await this.fillTextbox(section, /^Middle Name$/, data.middleName);
    await this.fillTextbox(section, /^Last Name/, data.lastName);

    const dobInput = section.getByRole("textbox", { name: /Date of Birth/ });
    await dobInput.fill(data.birthDate);

    const genderCombobox = section.getByRole("combobox", { name: /Gender/ });
    await genderCombobox.click();
    await this.page
      .getByRole("option", { name: data.gender, exact: true })
      .click();
    await expect(genderCombobox).toContainText(data.gender);

    await this.fillTextbox(
      section,
      /Social Security Number/,
      data.socialSecurityNumber
    );
    await this.fillTextbox(section, /^Race$/, data.race);
    await this.fillTextbox(section, /^Ethnicity$/, data.ethnicity);
  }

  async fillContactInformation(data: PatientFormTestData): Promise<void> {
    await this.scrollToSectionHeading(
      patientFormContent.sectionHeadings.contactInformation
    );

    await this.fillPhoneInput("Mobile Phone *", data.mobilePhone);
    await this.fillPhoneInput("Home Phone *", data.homePhone);
    await this.fillTextbox(
      this.contactInformationSection(),
      /^Email$/,
      data.email
    );
  }

  async fillAddressInformation(data: PatientFormTestData): Promise<void> {
    const section = this.addressInformationSection();
    await section.scrollIntoViewIfNeeded();

    await section
      .locator('input[name="address_line_1"]')
      .fill(data.addressLine1);
    await section
      .locator('input[name="address_line_2"]')
      .fill(data.addressLine2);
    await section.locator('input[name="city"]').fill(data.city);

    await section.getByRole("combobox", { name: /State/ }).click();
    await this.page
      .getByPlaceholder(patientFormContent.stateSearchPlaceholder)
      .fill(data.state);
    await this.page.getByRole("option", { name: data.state }).click();

    await section.locator('input[name="zipcode"]').fill(data.zipCode);
    await section.locator('input[name="country"]').fill(data.country);
  }

  async updateLastName(lastName: string): Promise<void> {
    await this.fillTextbox(
      this.patientInformationSection(),
      /^Last Name/,
      lastName
    );
  }

  async submit(): Promise<void> {
    await this.saveButton.scrollIntoViewIfNeeded();

    const createSubmission = this.page.waitForResponse(
      isPatientCreateResponse,
      {
        timeout: 30_000,
      }
    );

    await this.saveButton.click();
    await createSubmission;
  }

  async submitEmpty(): Promise<void> {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.saveButton.click();
  }

  async submitUpdate(): Promise<void> {
    await this.updateButton.scrollIntoViewIfNeeded();
    const updateSubmission = this.page.waitForResponse(
      isPatientUpdateResponse,
      { timeout: 30_000 }
    );
    await this.updateButton.click();
    await updateSubmission;
  }

  async createPatient(data: PatientFormTestData): Promise<void> {
    await this.fillPatientInformation(data);
    await this.fillContactInformation(data);
    await this.fillAddressInformation(data);
    await this.submit();
  }

  async expectRequiredFieldMessages(): Promise<void> {
    const messages = patientFormContent.requiredMessages;
    await expect(this.page.getByText(messages.firstName)).toBeVisible({
      timeout: 10_000,
    });
    await expect(this.page.getByText(messages.lastName)).toBeVisible();
    await expect(this.page.getByText(messages.dateOfBirth)).toBeVisible();
    await expect(this.page.getByText(messages.gender)).toBeVisible();
    await expect(this.page.getByText(messages.mobilePhone)).toBeVisible();
    await expect(this.page.getByText(messages.homePhone)).toBeVisible();
    await expect(this.page.getByText(messages.address)).toBeVisible();
    await expect(this.page.getByText(messages.city)).toBeVisible();
    await expect(this.page.getByText(messages.state)).toBeVisible();
    await expect(this.page.getByText(messages.zipCode)).toBeVisible();
  }

  async expectSuccessToast(): Promise<void> {
    await expect(
      this.page.getByText(patientFormContent.successMessage)
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectUpdateSuccessToast(): Promise<void> {
    await expect(
      this.page.getByText(patientFormContent.updateSuccessMessage)
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectRedirectToList(): Promise<void> {
    await this.expectUrl(new RegExp(`${appPaths.patients}/?$`));
  }

  private get saveButton() {
    return this.page.getByRole("button", {
      name: patientFormContent.saveButton,
    });
  }

  private get updateButton() {
    return this.page.getByRole("button", {
      name: patientFormContent.updateButton,
    });
  }

  private clientInformationSection(): Locator {
    return this.sectionByHeading(
      patientFormContent.sectionHeadings.clientInformation
    );
  }

  private patientInformationSection(): Locator {
    return this.sectionByHeading(
      patientFormContent.sectionHeadings.patientInformation
    );
  }

  private contactInformationSection(): Locator {
    return this.sectionByHeading(
      patientFormContent.sectionHeadings.contactInformation
    );
  }

  private addressInformationSection(): Locator {
    return this.sectionByHeading(
      patientFormContent.sectionHeadings.addressInformation
    );
  }

  private sectionByHeading(heading: string): Locator {
    return this.page
      .getByRole("heading", { name: heading, level: 2 })
      .locator("xpath=ancestor::section[1]");
  }

  private async scrollToSectionHeading(heading: string): Promise<void> {
    await this.sectionByHeading(heading).scrollIntoViewIfNeeded();
  }

  private async fillTextbox(
    section: Locator,
    name: string | RegExp,
    value: string
  ): Promise<void> {
    const input = section.getByRole("textbox", { name });
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await input.fill("");
    await input.pressSequentially(value, { delay: 20 });
    await input.blur();
    await expect(input).toHaveValue(value);
  }

  private async fillPhoneInput(
    accessibleName: string,
    digits: string
  ): Promise<void> {
    const input = this.page.getByRole("textbox", { name: accessibleName });
    await input.click();
    await input.fill("");
    await input.pressSequentially(digits, { delay: 50 });
  }
}
