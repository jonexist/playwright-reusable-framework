import { expect, Locator, Page } from "@playwright/test";
import { isClientCreateResponse } from "../api/api-matchers";
import {
  appPaths,
  clientFormContent,
  type ClientFormTestData,
} from "../config/test-data";
import { BasePage } from "./base-page";

export class ClientFormPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: clientFormContent.heading })
    ).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  async fillClientInformation(data: ClientFormTestData): Promise<void> {
    await this.scrollToSectionHeading(
      clientFormContent.sectionHeadings.clientInformation
    );

    await this.page.locator('input[name="name"]').fill(data.name);
    await this.page.locator('input[name="employer_code"]').fill(data.employerCode);
    await this.page
      .locator('input[name="insurance_group_id"]')
      .fill(data.insuranceGroupId);
    await this.page
      .locator('input[name="insurance_employer_group_name"]')
      .fill(data.insuranceEmployerGroupName);
    await this.page
      .locator('input[name="parent_account"]')
      .fill(data.parentAccount);
    await this.page
      .locator('input[name="provider_code"]')
      .fill(data.providerCode);
    await this.page
      .locator('input[name="billing_group"]')
      .fill(data.billingGroup);
    await this.page
      .locator('input[name="eligible_employees"]')
      .fill(data.eligibleEmployees);
    await this.page
      .locator('input[name="total_enrollment"]')
      .fill(data.totalEnrollment);
    await this.page.locator('input[name="start_date"]').fill(data.startDate);
    await this.page.locator('input[name="renewal_date"]').fill(data.renewalDate);

    await this.page
      .getByRole("combobox")
      .filter({ hasText: clientFormContent.tpaSubgroupPlaceholder })
      .click();
    await this.page.getByRole("option", { name: data.tpaSubgroup }).click();

    await this.page.locator('input[name="vi_share"]').fill(data.viShare);
  }

  async fillAddress(data: ClientFormTestData): Promise<void> {
    await this.scrollToSectionHeading(clientFormContent.sectionHeadings.address);

    await this.page
      .locator('input[name="address_line_1"]')
      .fill(data.addressLine1);
    await this.page
      .locator('input[name="address_line_2"]')
      .fill(data.addressLine2);
    await this.page.locator('input[name="city"]').fill(data.city);
    await this.page.locator('input[name="state"]').fill(data.state);
    await this.page.locator('input[name="zipcode"]').fill(data.zipCode);
    await this.page.locator('input[name="country"]').fill(data.country);

    await this.page.getByLabel("Phone Number").fill(data.phoneNumber);
    await this.page.getByLabel("Fax").fill(data.fax);
  }

  async fillContacts(data: ClientFormTestData): Promise<void> {
    await this.scrollToSectionHeading(clientFormContent.sectionHeadings.contacts);

    const primarySection = this.contactSection(
      clientFormContent.sectionHeadings.primaryContact
    );
    await primarySection
      .locator('input[name="primary_contact.first_name"]')
      .fill(data.primaryContact.firstName);
    await primarySection
      .locator('input[name="primary_contact.last_name"]')
      .fill(data.primaryContact.lastName);
    await primarySection
      .locator('input[name="primary_contact.email"]')
      .fill(data.primaryContact.email);
    await primarySection.getByLabel("Phone").fill(data.primaryContact.phone);

    const secondarySection = this.contactSection(
      clientFormContent.sectionHeadings.secondaryContact
    );
    await secondarySection
      .locator('input[name="secondary_contact.first_name"]')
      .fill(data.secondaryContact.firstName);
    await secondarySection
      .locator('input[name="secondary_contact.last_name"]')
      .fill(data.secondaryContact.lastName);
    await secondarySection
      .locator('input[name="secondary_contact.email"]')
      .fill(data.secondaryContact.email);
    await secondarySection.getByLabel("Phone").fill(data.secondaryContact.phone);

    await this.page.locator('input[name="sales_rep_1"]').fill(data.salesRep1);
    await this.page.locator('input[name="sales_rep_2"]').fill(data.salesRep2);
    await this.page
      .locator('input[name="client_relations_manager"]')
      .fill(data.clientRelationsManager);
    await this.page
      .locator('input[name="contact_us_email"]')
      .fill(data.contactUsEmail);
    await this.page.getByLabel("Contact Us Phone").fill(data.contactUsPhone);
  }

  async submit(): Promise<void> {
    await this.saveButton.scrollIntoViewIfNeeded();

    const createSubmission = this.page.waitForResponse(isClientCreateResponse, {
      timeout: 30_000,
    });

    await this.saveButton.click();
    await createSubmission;
  }

  async createClient(data: ClientFormTestData): Promise<void> {
    await this.fillClientInformation(data);
    await this.fillAddress(data);
    await this.fillContacts(data);
    await this.submit();
  }

  async expectSuccessToast(): Promise<void> {
    await expect(
      this.page.getByText(clientFormContent.successMessage)
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectRedirectToList(): Promise<void> {
    await this.expectUrl(new RegExp(`${appPaths.clientManager}/?$`));
  }

  private get saveButton() {
    return this.page.getByRole("button", { name: clientFormContent.saveButton });
  }

  private contactSection(heading: string): Locator {
    return this.page
      .locator("h3")
      .filter({ hasText: heading })
      .locator("xpath=ancestor::div[contains(@class,'space-y-4')][1]");
  }

  private async scrollToSectionHeading(heading: string): Promise<void> {
    const section = this.page.getByRole("heading", { name: heading, level: 2 });
    await section.scrollIntoViewIfNeeded();
  }
}
