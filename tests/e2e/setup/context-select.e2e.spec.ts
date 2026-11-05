import { appPaths } from "../../../src/app/config/app-config";
import { storageStatePaths } from "../../../src/app/auth/storage-states";
import { authenticatedTest } from "../../../src/app/fixtures/test-fixtures";
import { workspaceManifest } from "../../../src/app/helpers/workspace-manifest";

/**
 * Setup tier, step 2 of 2. Selects the workspace in the top bar and saves the
 * resulting session (cookies included) as `scoped.storage-state.json`.
 * Downstream projects load that file instead of re-selecting a workspace in
 * every spec.
 */
authenticatedTest.describe("Workspace context setup", () => {
  authenticatedTest(
    "selects the workspace and saves the scoped session",
    async ({ page, context, workspacePickerPage }) => {
      const { workspaceName } = workspaceManifest.require("workspaceName");

      await page.goto(appPaths.dashboard);
      await workspacePickerPage.expectNothingSelected();
      await workspacePickerPage.selectWorkspace(workspaceName);
      await workspacePickerPage.expectSelected(workspaceName);

      await context.storageState({ path: storageStatePaths.scoped });
    }
  );
});
