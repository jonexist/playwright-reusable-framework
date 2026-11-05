import { env, requireEnvValue } from "../../core/config/env";

export function hasTestUserCredentials(): boolean {
  return Boolean(env.TEST_USER_EMAIL && env.TEST_USER_PASSWORD);
}

export function hasRestrictedUserCredentials(): boolean {
  return Boolean(
    env.TEST_RESTRICTED_USER_EMAIL && env.TEST_RESTRICTED_USER_PASSWORD
  );
}

/**
 * Getters, not values: a missing variable only throws when a spec actually
 * reads it, so credential-gated specs can `test.skip(...)` first.
 */
export const testUsers = {
  defaultUser: {
    get email(): string {
      return requireEnvValue(env.TEST_USER_EMAIL, "TEST_USER_EMAIL");
    },
    get password(): string {
      return requireEnvValue(env.TEST_USER_PASSWORD, "TEST_USER_PASSWORD");
    },
  },
  restrictedUser: {
    get email(): string {
      return requireEnvValue(
        env.TEST_RESTRICTED_USER_EMAIL,
        "TEST_RESTRICTED_USER_EMAIL"
      );
    },
    get password(): string {
      return requireEnvValue(
        env.TEST_RESTRICTED_USER_PASSWORD,
        "TEST_RESTRICTED_USER_PASSWORD"
      );
    },
  },
};

/** Every route the suite visits, in one place. */
export const appPaths = {
  login: env.LOGIN_PATH,
  dashboard: "/dashboard",
  createWorkspace: "/workspaces/new",
  items: "/items",
  createItem: "/items/new",
  claim: "/claim",
};

/**
 * What the restricted (read-only) user may do. Mirrors the seeded role the
 * same way `restrictedUserAccess` did in ProactiveMD.
 */
export const restrictedUserAccess = {
  allowedPath: "/items",
  deniedWritePath: "/items/new",
};

/**
 * Visible copy lives with the data, not in page objects, so a wording change
 * is a one-line edit and specs can reuse the strings in assertions.
 */
export const loginPageContent = {
  heading: "Sign in to your account",
  pageTitlePattern: /Demo App - Sign In/,
  signInButton: "Sign in",
  invalidCredentialsError: "Invalid email or password",
};

export const workspaceFormContent = {
  heading: "Create Workspace",
  saveButton: "Save Workspace",
  successMessage: "Workspace created successfully!",
  requiredMessages: { name: "Workspace name is required" },
  picker: {
    placeholder: "Select workspace",
    searchPlaceholder: "Search workspaces",
  },
};

export const itemsPageContent = {
  heading: "Items",
  createLink: "Create New Item",
  searchPlaceholder: "Search items",
  statusFilterSubmenu: /^Status/,
  activeFilter: "Active",
  archivedFilter: "Archived",
  archiveAction: "Archive",
  deleteAction: "Delete",
  deleteSuccess: "Item deleted",
  noWorkspaceMessage: "Select a workspace to see items",
};

export const itemFormContent = {
  heading: "Create Item",
  saveButton: "Save Item",
  successMessage: "Item created successfully!",
  requiredMessages: { name: "Item name is required" },
};

export const accessDeniedContent = {
  heading: "Access Denied",
  addMessage:
    "Your role does not have permission to create new records in this module.",
};

export const claimPageContent = {
  heading: "Claim Slot",
  claimButton: "Claim slot",
  releaseButton: "Release slot",
  claimedToast: "Slot claimed",
  releasedToast: "Slot released",
};
