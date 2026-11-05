import { appPaths } from "../../../src/config/test-data";
import { storageStatePaths } from "../../../src/auth/storage-state";
import { readTenantManifest } from "../../../src/helpers/e2e-tenant-manifest";
import {
  authenticatedTest,
  hasTestUserCredentials,
} from "../../../src/fixtures/test-fixtures";

authenticatedTest.describe("Tenant context", () => {
  authenticatedTest.setTimeout(60_000);

  authenticatedTest("selects client and location in top navigation", async ({
    page,
    topNavContextPage,
  }) => {
    authenticatedTest.skip(
      !hasTestUserCredentials(),
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
    );

    const manifest = readTenantManifest();

    await page.goto(appPaths.missionControl);
    await topNavContextPage.selectClientAndLocation(manifest);
    await topNavContextPage.expectClientSelected(manifest.clientName);
    await topNavContextPage.expectLocationSelected(manifest.locationName);
    await page
      .context()
      .storageState({ path: storageStatePaths.tenantContext });
  });
});
