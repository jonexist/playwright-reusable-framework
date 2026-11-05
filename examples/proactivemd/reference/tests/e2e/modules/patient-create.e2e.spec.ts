import { appPaths } from "../../../src/config/test-data";
import { readTenantManifest } from "../../../src/helpers/e2e-tenant-manifest";
import {
  buildPatientFormValues,
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";
import { SidebarPage } from "../../../src/pages/sidebar-page";

tenantContextTest.describe("Patient Creation", () => {
  tenantContextTest.setTimeout(120_000);

  tenantContextTest(
    "creates a new patient",
    async ({ page, patientManagerPage, patientFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const patient = buildPatientFormValues();
      const { clientName, locationName } = readTenantManifest();
      const fullName = `${patient.firstName} ${patient.lastName}`;

      await page.goto(appPaths.missionControl);
      const sidebar = new SidebarPage(page);
      await sidebar.navigateToPath(appPaths.patients);

      await patientManagerPage.expectLoaded();
      await patientManagerPage.openCreatePatient();

      await patientFormPage.expectLoaded();
      await patientFormPage.expectTenantPrefilled(clientName, locationName);
      await patientFormPage.createPatient(patient);
      await patientFormPage.expectSuccessToast();
      await patientFormPage.expectRedirectToList();
      await patientManagerPage.expectPatientVisible(fullName);
    }
  );
});
