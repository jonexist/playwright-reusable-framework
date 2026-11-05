import { appPaths, purposePageContent } from "../../../src/config/test-data";
import {
  mergeScheduleManifest,
  readTenantManifest,
} from "../../../src/helpers/e2e-tenant-manifest";
import {
  buildScheduleFormValues,
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";

tenantContextTest.describe.configure({ mode: "serial" });

tenantContextTest.describe("Schedule setup", () => {
  tenantContextTest.setTimeout(120_000);

  tenantContextTest(
    "creates a schedule with biometric purpose",
    async ({ page, scheduleManagerPage, scheduleFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const manifest = readTenantManifest();
      const purposeName =
        manifest.biometricPurposeName ?? purposePageContent.biometricPurposeName;
      // Biometric purpose requires a Venipuncture answer; "No" keeps the shared
      // E2E schedule out of the daily venipuncture extraction.
      const schedule = buildScheduleFormValues({ isVenipunctureEvent: false });

      await page.goto(appPaths.schedules);
      await scheduleManagerPage.expectLoaded();
      await scheduleManagerPage.openCreateSchedule();

      await scheduleFormPage.expectLoaded();
      const { id, slug: slugFromCreate } = await scheduleFormPage.createSchedule(
        schedule,
        manifest.clientName,
        manifest.locationName,
        purposeName
      );
      await scheduleFormPage.expectSuccessToast();
      await scheduleFormPage.expectRedirectToDetail(id);
      await scheduleFormPage.expectDetailLoaded(schedule.name);

      const scheduleSlug =
        slugFromCreate ?? (await scheduleFormPage.fetchSlug(id));
      if (!scheduleSlug) {
        throw new Error(
          "Could not determine created schedule slug from create response or detail GET."
        );
      }

      mergeScheduleManifest({
        scheduleName: schedule.name,
        scheduleId: id,
        scheduleSlug,
      });
    }
  );

  tenantContextTest(
    "adds an open event for today on the schedule",
    async ({ page, scheduleFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const manifest = readTenantManifest();
      if (!manifest.scheduleName || !manifest.scheduleId) {
        throw new Error(
          "Schedule setup did not persist scheduleName/scheduleId. Run schedule create first."
        );
      }

      // Prefer direct navigation with the id persisted from create (avoids list/link assumptions).
      await page.goto(`${appPaths.schedules}/${manifest.scheduleId}`);
      await scheduleFormPage.expectDetailLoaded(manifest.scheduleName);

      const { eventId, eventDate } =
        await scheduleFormPage.createOpenEventForToday();

      mergeScheduleManifest({
        scheduleName: manifest.scheduleName,
        scheduleId: manifest.scheduleId,
        scheduleSlug: manifest.scheduleSlug,
        scheduleEventId: eventId,
        scheduleEventDate: eventDate,
      });
    }
  );

  // Flu processing needs its own flu-purpose schedule; the biometric
  // scheduleName/scheduleSlug above stay untouched for public registration.
  tenantContextTest(
    "creates a schedule with flu shot purpose",
    async ({ page, scheduleManagerPage, scheduleFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const manifest = readTenantManifest();
      const purposeName =
        manifest.fluShotPurposeName ?? purposePageContent.fluShotPurposeName;
      const schedule = buildScheduleFormValues();

      await page.goto(appPaths.schedules);
      await scheduleManagerPage.expectLoaded();
      await scheduleManagerPage.openCreateSchedule();

      await scheduleFormPage.expectLoaded();
      const { id, slug: slugFromCreate } = await scheduleFormPage.createSchedule(
        schedule,
        manifest.clientName,
        manifest.locationName,
        purposeName
      );
      await scheduleFormPage.expectSuccessToast();
      await scheduleFormPage.expectRedirectToDetail(id);
      await scheduleFormPage.expectDetailLoaded(schedule.name);

      mergeScheduleManifest({
        fluScheduleName: schedule.name,
        fluScheduleId: id,
        fluScheduleSlug:
          slugFromCreate ?? (await scheduleFormPage.fetchSlug(id)),
      });
    }
  );

  tenantContextTest(
    "adds an open event for today on the flu schedule",
    async ({ page, scheduleFormPage }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const manifest = readTenantManifest();
      if (!manifest.fluScheduleName || !manifest.fluScheduleId) {
        throw new Error(
          "Schedule setup did not persist fluScheduleName/fluScheduleId. Run flu schedule create first."
        );
      }

      await page.goto(`${appPaths.schedules}/${manifest.fluScheduleId}`);
      await scheduleFormPage.expectDetailLoaded(manifest.fluScheduleName);

      const { eventId, eventDate } =
        await scheduleFormPage.createOpenEventForToday();

      mergeScheduleManifest({
        fluScheduleEventId: eventId,
        fluScheduleEventDate: eventDate,
      });
    }
  );
});
