import { appPaths } from "../../../src/config/test-data";
import { readTenantManifest } from "../../../src/helpers/e2e-tenant-manifest";
import {
  buildWalkinPatientValues,
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";

tenantContextTest.describe("Appointments walk-in", () => {
  tenantContextTest.setTimeout(180_000);

  tenantContextTest(
    "registers a walk-in patient against today's schedule event",
    async ({ page, appointmentsPage, walkinPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const manifest = readTenantManifest();
      if (!manifest.scheduleName) {
        throw new Error(
          "E2E tenant manifest is missing scheduleName. Run e2e-schedule-setup first."
        );
      }

      const patient = buildWalkinPatientValues();
      const fullName = `${patient.firstName} ${patient.lastName}`;

      await page.goto(appPaths.appointments);
      await appointmentsPage.expectLoaded();
      await appointmentsPage.openWalkinRegistration();

      await walkinPage.expectLoaded();
      await walkinPage.registerWalkin(
        manifest.clientName,
        manifest.locationName,
        manifest.scheduleName,
        patient
      );

      await page.goto(appPaths.appointments);
      await appointmentsPage.expectLoaded();
      await appointmentsPage.expectAppointmentVisible(fullName);
    }
  );
});
