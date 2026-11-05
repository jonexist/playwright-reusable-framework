import { appPaths } from "../../../src/config/test-data";
import { readTenantManifest } from "../../../src/helpers/e2e-tenant-manifest";
import {
  buildBiometricPatientDemographics,
  buildBiometricVitalsValues,
  buildManualOutsideProviderValues,
  buildPatientFormValues,
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";
import { SidebarPage } from "../../../src/pages/sidebar-page";

tenantContextTest.describe.configure({ mode: "serial" });

tenantContextTest.describe("Biometric Creation", () => {
  tenantContextTest.setTimeout(120_000);

  tenantContextTest(
    "creates a new biometric screening with provider and performed date",
    async ({ page, biometricManagerPage, biometricWizardPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const demographics = buildBiometricPatientDemographics();
      const vitals = buildBiometricVitalsValues();
      const provider = buildManualOutsideProviderValues();
      const fullName = `${demographics.firstName} ${demographics.lastName}`;
      const { clientName, locationName, biometricPurposeName } =
        readTenantManifest();

      if (!biometricPurposeName) {
        throw new Error(
          "E2E tenant manifest is missing biometricPurposeName. Run yarn test:e2e:setup first."
        );
      }

      await page.goto(appPaths.missionControl);
      const sidebar = new SidebarPage(page);
      await sidebar.navigateToPath(appPaths.healthScreenResults);

      await biometricManagerPage.expectLoaded();
      await biometricManagerPage.openCreateScreening();

      await biometricWizardPage.expectCreateLoaded();
      await biometricWizardPage.expectTenantPrefilled(clientName, locationName);
      await biometricWizardPage.createScreening(
        demographics,
        vitals,
        biometricPurposeName,
        provider
      );
      await biometricWizardPage.expectSuccessToast();
      await biometricWizardPage.expectDetailsPage();
      await biometricWizardPage.expectDetailsShowsProvider(provider);

      await sidebar.navigateToPath(appPaths.healthScreenResults);
      await biometricManagerPage.expectLoaded();
      await biometricManagerPage.searchByPatientName(fullName);
      await biometricManagerPage.expectScreeningVisible(fullName);
      await biometricManagerPage.expectProviderVisibleInRow(
        fullName,
        provider.providerName,
        provider.providerNpi
      );
    }
  );

  tenantContextTest(
    "creates a biometric screening for an existing patient",
    async ({
      page,
      patientManagerPage,
      patientFormPage,
      biometricManagerPage,
      biometricWizardPage,
    }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const patient = buildPatientFormValues();
      const vitals = buildBiometricVitalsValues();
      const provider = buildManualOutsideProviderValues();
      const { clientName, locationName, biometricPurposeName } =
        readTenantManifest();

      if (!biometricPurposeName) {
        throw new Error(
          "E2E tenant manifest is missing biometricPurposeName. Run yarn test:e2e:setup first."
        );
      }

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

      await sidebar.navigateToPath(appPaths.healthScreenResults);
      await biometricManagerPage.expectLoaded();
      await biometricManagerPage.openCreateScreening();

      await biometricWizardPage.expectCreateLoaded();
      await biometricWizardPage.expectTenantPrefilled(clientName, locationName);
      await biometricWizardPage.createScreeningForExistingPatient(
        fullName,
        vitals,
        biometricPurposeName,
        provider
      );
      await biometricWizardPage.expectSuccessToast();
      await biometricWizardPage.expectDetailsPage();
      await biometricWizardPage.expectDetailsShowsProvider(provider);
    }
  );

  tenantContextTest(
    "finds biometric screening by full patient name on Biometric Screening tab",
    async ({ page, biometricManagerPage, biometricWizardPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const demographics = buildBiometricPatientDemographics();
      const vitals = buildBiometricVitalsValues();
      const fullName = `${demographics.firstName} ${demographics.lastName}`;
      const { clientName, locationName, biometricPurposeName } =
        readTenantManifest();

      if (!biometricPurposeName) {
        throw new Error(
          "E2E tenant manifest is missing biometricPurposeName. Run yarn test:e2e:setup first."
        );
      }

      await page.goto(appPaths.missionControl);
      const sidebar = new SidebarPage(page);
      await sidebar.navigateToPath(appPaths.healthScreenResults);

      await biometricManagerPage.expectLoaded();
      await biometricManagerPage.openCreateScreening();
      await biometricWizardPage.expectCreateLoaded();
      await biometricWizardPage.expectTenantPrefilled(clientName, locationName);
      await biometricWizardPage.createScreening(
        demographics,
        vitals,
        biometricPurposeName
      );
      await biometricWizardPage.expectSuccessToast();

      await sidebar.navigateToPath(appPaths.healthScreenResults);
      await biometricManagerPage.expectLoaded();
      await biometricManagerPage.openBiometricTab();
      await biometricManagerPage.searchByPatientName(fullName);
      await biometricManagerPage.expectScreeningVisible(fullName);
    }
  );
});
