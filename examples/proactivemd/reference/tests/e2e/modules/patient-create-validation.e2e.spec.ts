import {
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";
import { SidebarPage } from "../../../src/pages/sidebar-page";
import { appPaths } from "../../../src/config/test-data";

tenantContextTest.describe("Patient create validation", () => {
  tenantContextTest.setTimeout(120_000);

  tenantContextTest(
    "shows required-field messages on empty submit",
    async ({ page, patientManagerPage, patientFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      await page.goto(appPaths.missionControl);
      const sidebar = new SidebarPage(page);
      await sidebar.navigateToPath(appPaths.patients);

      await patientManagerPage.expectLoaded();
      await patientManagerPage.openCreatePatient();

      await patientFormPage.expectLoaded();
      await patientFormPage.submitEmpty();
      await patientFormPage.expectRequiredFieldMessages();
    }
  );
});
