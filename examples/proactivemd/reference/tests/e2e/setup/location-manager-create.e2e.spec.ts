import {
  mergeLocationManifest,
  readClientFromManifest,
} from "../../../src/helpers/e2e-tenant-manifest";
import {
  authenticatedTest,
  buildLocationFormValues,
  hasTestUserCredentials,
} from "../../../src/fixtures/test-fixtures";

// Requires TEST_USER with `add` permission on /administration/location-manager.
// Runs in e2e-location project; depends on e2e-client-setup creating a Leaf Village client first.
authenticatedTest.describe("Location Manager", () => {
  authenticatedTest.setTimeout(120_000);

  authenticatedTest("creates a new location", async ({
    locationManagerPage,
    locationFormPage,
  }) => {
    authenticatedTest.skip(
      !hasTestUserCredentials(),
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
    );

    const { clientName } = readClientFromManifest();
    const location = buildLocationFormValues({
      clientSearchQuery: clientName,
    });

    // Direct goto — avoids brittle mission-control load under CI worker contention.
    await locationManagerPage.goto();
    await locationManagerPage.expectLoaded();

    await locationManagerPage.openCreateLocation();
    await locationFormPage.expectLoaded();
    await locationFormPage.createLocation(location);
    await locationFormPage.expectSuccessToast();
    await locationFormPage.expectRedirectToList();
    await locationManagerPage.expectLocationVisible(location.name);

    mergeLocationManifest({ locationName: location.name });
  });
});
