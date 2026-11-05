import { createGlobalSetup } from "../../core/auth/global-setup";
import {
  hasTestUserCredentials,
  testUsers,
} from "../config/app-config";
import { storageStatePaths } from "./storage-states";

/** Referenced by `globalSetup` in playwright.config.ts. */
export default createGlobalSetup([
  {
    name: "standardUser",
    credentials: () =>
      hasTestUserCredentials()
        ? {
            email: testUsers.defaultUser.email,
            password: testUsers.defaultUser.password,
          }
        : undefined,
    storageStatePath: storageStatePaths.standardUser,
  },
]);
