import { appPaths, purposePageContent } from "../../../src/config/test-data";
import {
  mergePurposeManifest,
  readTenantManifest,
} from "../../../src/helpers/e2e-tenant-manifest";
import {
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";

tenantContextTest.describe.configure({ mode: "serial" });

tenantContextTest.describe("Purpose setup", () => {
  tenantContextTest.setTimeout(120_000);

  tenantContextTest(
    "creates Biometric Screening purpose if missing",
    async ({ page, purposeManagerPage, purposeFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const purposeName = purposePageContent.biometricPurposeName;
      const { clientName } = readTenantManifest();

      await page.goto(appPaths.purposes);
      await purposeManagerPage.expectLoaded();

      if (await purposeManagerPage.isPurposeVisible(purposeName)) {
        const code =
          await purposeManagerPage.getPurposeCodeFromRow(purposeName);
        // Biometric module specs fill Birth Sex and Mobile Phone.
        await purposeManagerPage.openEditPurpose(purposeName, clientName);
        await purposeFormPage.expectEditLoaded();
        await purposeFormPage.ensureRegistrationFieldsShown([
          purposePageContent.registrationFields.birthSex,
          purposePageContent.registrationFields.phoneNumber,
        ]);
        mergePurposeManifest({
          biometricPurposeName: purposeName,
          biometricPurposeCode: code,
        });
        return;
      }

      await purposeManagerPage.openCreatePurpose();
      await purposeFormPage.expectLoaded();
      const code = await purposeFormPage.createBiometricPurpose(
        purposeName,
        clientName
      );
      await purposeFormPage.expectSuccessToast();
      await purposeFormPage.expectRedirectToList();
      await purposeManagerPage.expectPurposeVisible(purposeName);

      mergePurposeManifest({
        biometricPurposeName: purposeName,
        biometricPurposeCode: code,
      });
    }
  );

  tenantContextTest(
    "creates Flu Shot Event purpose if missing",
    async ({ page, purposeManagerPage, purposeFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const purposeName = purposePageContent.fluShotPurposeName;
      const { clientName } = readTenantManifest();

      await page.goto(appPaths.purposes);
      await purposeManagerPage.expectLoaded();

      if (await purposeManagerPage.isPurposeVisible(purposeName)) {
        const code =
          await purposeManagerPage.getPurposeCodeFromRow(purposeName);
        // Birth Sex is never configurable for Flu Shot Event; only Phone is.
        await purposeManagerPage.openEditPurpose(purposeName, clientName);
        await purposeFormPage.expectEditLoaded();
        await purposeFormPage.ensureRegistrationFieldsShown([
          purposePageContent.registrationFields.phoneNumber,
        ]);
        mergePurposeManifest({
          fluShotPurposeName: purposeName,
          fluShotPurposeCode: code,
        });
        return;
      }

      await purposeManagerPage.openCreatePurpose();
      await purposeFormPage.expectLoaded();
      const code = await purposeFormPage.createFluShotPurpose(
        purposeName,
        clientName
      );
      await purposeFormPage.expectSuccessToast();
      await purposeFormPage.expectRedirectToList();
      await purposeManagerPage.expectPurposeVisible(purposeName);

      mergePurposeManifest({
        fluShotPurposeName: purposeName,
        fluShotPurposeCode: code,
      });
    }
  );
});
