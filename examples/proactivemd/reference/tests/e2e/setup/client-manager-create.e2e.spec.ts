import { appPaths } from "../../../src/config/test-data";
import { writeClientManifest } from "../../../src/helpers/e2e-tenant-manifest";
import {
  authenticatedTest,
  buildClientFormValues,
  hasTestUserCredentials,
} from "../../../src/fixtures/test-fixtures";
import { SidebarPage } from "../../../src/pages/sidebar-page";

// Requires TEST_USER with `add` permission on /administration/client-manager.
authenticatedTest.describe("Client Manager", () => {
  authenticatedTest.setTimeout(120_000);

  authenticatedTest("creates a new client", async ({
    page,
    clientManagerPage,
    clientFormPage,
  }) => {
    authenticatedTest.skip(
      !hasTestUserCredentials(),
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
    );

    const client = buildClientFormValues();

    await page.goto(appPaths.missionControl);
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToPath(appPaths.clientManager);
    await clientManagerPage.expectLoaded();

    await clientManagerPage.openCreateClient();
    await clientFormPage.expectLoaded();
    await clientFormPage.createClient(client);
    await clientFormPage.expectSuccessToast();
    await clientFormPage.expectRedirectToList();
    await clientManagerPage.expectClientVisible(client.name);

    writeClientManifest({
      clientName: client.name,
      employerCode: client.employerCode,
    });
  });
});
