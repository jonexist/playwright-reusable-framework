import { appPaths } from "../../../src/app/config/app-config";
import { buildWorkspaceValues } from "../../../src/app/data/builders";
import { authenticatedTest } from "../../../src/app/fixtures/test-fixtures";
import { workspaceManifest } from "../../../src/app/helpers/workspace-manifest";

/**
 * Setup tier, step 1 of 2. Creates the workspace the rest of the suite runs
 * inside and records its name. `replace` (not `merge`) starts a fresh
 * manifest, so a stale one from a previous run can never leak in.
 *
 * Needs: write permission (the default admin user).
 */
authenticatedTest.describe("Workspace setup", () => {
  authenticatedTest(
    "creates a unique workspace and records it in the manifest",
    async ({ page, workspaceFormPage }) => {
      const workspace = buildWorkspaceValues();

      await page.goto(appPaths.dashboard);
      await workspaceFormPage.goto();
      await workspaceFormPage.expectLoaded();
      await workspaceFormPage.createWorkspace(workspace);
      await workspaceFormPage.expectSuccessToast();

      workspaceManifest.replace({ workspaceName: workspace.name });
    }
  );
});
