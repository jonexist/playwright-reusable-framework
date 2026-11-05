import type { Browser } from "@playwright/test";
import {
  buildWalkinPatientValues,
  type WalkinPatientTestData,
} from "../config/test-data";
import { PublicRegistrationPage } from "../pages/public-registration-page";
import { readTenantManifest } from "./e2e-tenant-manifest";

/**
 * Books a public (non-walk-in, status booked) appointment on the e2e biometric
 * schedule from a logged-out context, like a patient would. Staff walk-ins are
 * created checked_in with is_walk_in=true, so they can't exercise Check In,
 * No show, or Uncheck in.
 */
export async function bookPublicAppointment(
  browser: Browser
): Promise<WalkinPatientTestData & { fullName: string }> {
  const manifest = readTenantManifest();
  if (!manifest.scheduleSlug) {
    throw new Error(
      "E2E tenant manifest is missing scheduleSlug. Run e2e-schedule-setup first."
    );
  }

  const patient = buildWalkinPatientValues();
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });

  try {
    const publicPage = new PublicRegistrationPage(await context.newPage());
    await publicPage.gotoBySlug(manifest.scheduleSlug);
    await publicPage.expectLoaded(manifest.scheduleName);
    await publicPage.register(patient);
  } finally {
    await context.close();
  }

  return { ...patient, fullName: `${patient.firstName} ${patient.lastName}` };
}
