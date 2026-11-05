import { defineStorageStates } from "../../core/auth/storage-state";

/**
 * One saved session per "kind of user/context" a spec can start from:
 *  - standardUser   : written by global-setup (logged in, no workspace)
 *  - scoped         : standardUser + a selected workspace (tenant context)
 *  - restrictedUser : written by the `e2e-rbac-setup` project
 */
export const storageStatePaths = defineStorageStates([
  "standardUser",
  "scoped",
  "restrictedUser",
] as const);
