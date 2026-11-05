import { appPaths } from "../../../src/config/test-data";
import { readTenantManifest } from "../../../src/helpers/e2e-tenant-manifest";
import {
  buildWalkinPatientValues,
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";

tenantContextTest.describe("Event Queue", () => {
  tenantContextTest.setTimeout(180_000);

  tenantContextTest(
    "shows a checked-in walk-in patient and claims them from Waiting",
    async ({ page, walkinPage, queueDisplayPage }) => {
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

      await page.goto(appPaths.walkinRegistration);
      await walkinPage.expectLoaded();
      await walkinPage.registerWalkin(
        manifest.clientName,
        manifest.locationName,
        manifest.scheduleName,
        patient
      );

      await page.goto(appPaths.queueDisplay);
      await queueDisplayPage.expectLoaded();
      await queueDisplayPage.grabPatient(fullName);
      await queueDisplayPage.expectPatientNowServing(fullName);

      // Screening claim is capped at one in-progress patient per staff user
      // per location; release so this shared E2E login doesn't permanently
      // occupy that slot and block other specs (e.g.
      // queue-process-appointment.e2e.spec.ts) that also need to claim here.
      await queueDisplayPage.releasePatient();
    }
  );
});
