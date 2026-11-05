import { test as base } from "@playwright/test";
import {
  createPageFixtures,
  storageStateContext,
  type PageFixtureTypes,
} from "../../core/fixtures/fixture-helpers";
import { storageStatePaths } from "../auth/storage-states";
import {
  hasRestrictedUserCredentials,
  hasTestUserCredentials,
} from "../config/app-config";
import "../config/ui"; // side effect: applies the app's UI conventions
import { ClaimPage } from "../pages/claim-page";
import { ItemFormPage } from "../pages/item-form-page";
import { ItemsPage } from "../pages/items-page";
import { LoginPage } from "../pages/login-page";
import { WorkspaceFormPage } from "../pages/workspace-form-page";
import { WorkspacePickerPage } from "../pages/workspace-picker-page";

/**
 * Register every page object ONCE here. Specs then ask for them by name:
 *   test("...", async ({ itemsPage }) => { ... })
 */
const pages = {
  loginPage: LoginPage,
  workspaceFormPage: WorkspaceFormPage,
  workspacePickerPage: WorkspacePickerPage,
  itemsPage: ItemsPage,
  itemFormPage: ItemFormPage,
  claimPage: ClaimPage,
};

/** Anonymous browser — for UI smoke and login specs. */
export const test = base.extend<PageFixtureTypes<typeof pages>>(
  createPageFixtures(pages)
);

const missingDefaultUser = () =>
  hasTestUserCredentials()
    ? undefined
    : "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env";

/** Logged in as the default user (global-setup storage state). */
export const authenticatedTest = test.extend({
  context: storageStateContext({
    storageStatePath: storageStatePaths.standardUser,
    missingMessage:
      "Standard-user storage state is missing. Global setup should have written it — check TEST_USER_* and that the login page works.",
    skipReason: missingDefaultUser,
  }),
});

/**
 * Logged in AND scoped to the workspace created by the setup chain.
 * Missing credentials skip (legitimate local config); a missing scoped file
 * with credentials set throws (the setup project did not run — a mistake).
 */
export const scopedTest = authenticatedTest.extend({
  context: storageStateContext({
    storageStatePath: storageStatePaths.scoped,
    missingMessage:
      "Scoped storage state is missing. Run `npm run test:e2e:setup` first to create a workspace and select it.",
    skipReason: missingDefaultUser,
  }),
});

/** Non-superuser session (read-only) saved by the `e2e-rbac-setup` project. */
export const restrictedTest = authenticatedTest.extend({
  context: storageStateContext({
    storageStatePath: storageStatePaths.restrictedUser,
    missingMessage:
      "Restricted-user storage state is missing. Run the `e2e-rbac-setup` project first.",
    skipReason: () =>
      hasRestrictedUserCredentials()
        ? undefined
        : "Set TEST_RESTRICTED_USER_EMAIL and TEST_RESTRICTED_USER_PASSWORD in .env",
  }),
});

export { expect } from "@playwright/test";
export {
  hasRestrictedUserCredentials,
  hasTestUserCredentials,
} from "../config/app-config";
