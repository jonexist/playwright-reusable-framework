import { defineConfig, devices } from "@playwright/test";
import { env } from "./src/core/config/env";
import { storageStatePaths } from "./src/app/auth/storage-states";

const isCi = env.CI;

const globalTimeout =
  env.PLAYWRIGHT_GLOBAL_TIMEOUT_MS ?? (isCi ? 50 * 60_000 : 0);
const maxFailures = env.PLAYWRIGHT_MAX_FAILURES ?? (isCi ? 5 : undefined);

const desktopChrome = { ...devices["Desktop Chrome"] };

/** Logged in AND scoped to the workspace selected by the setup chain. */
const scopedSession = {
  ...desktopChrome,
  storageState: storageStatePaths.scoped,
};

/**
 * Suite membership is the FOLDER, not a filename glob: drop a spec into
 * tests/e2e/<tier>/ and it joins that tier's project. Only the setup chain
 * uses `testMatch`, because order inside a folder matters there.
 *
 * Dependency chain (Playwright runs prerequisites automatically):
 *
 *   e2e-setup-workspace -> e2e-setup-context -+-> e2e-modules
 *                                             +-> e2e-serial   (workers: 1)
 *   e2e-rbac-setup -> e2e-rbac
 *   unit | api | ui-chromium | e2e-auth        (independent)
 */
export default defineConfig({
  globalSetup: "./src/app/auth/global-setup.ts",
  testDir: "./tests",
  outputDir: "test-results",

  globalTimeout,
  timeout: isCi ? 60_000 : 30_000,
  maxFailures,
  expect: { timeout: 5_000 },

  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  ...(env.TEST_WORKERS
    ? { workers: env.TEST_WORKERS }
    : isCi
      ? { workers: 2 }
      : {}),

  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["junit", { outputFile: "reports/junit/results.xml" }],
    ["json", { outputFile: "reports/json/results.json" }],
  ],

  use: {
    baseURL: env.BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    // CI shares one server across workers; 30s is tight under contention.
    navigationTimeout: isCi ? 60_000 : 30_000,
  },

  // Serves the bundled demo app. Remove this block (or set START_DEMO_APP=false)
  // when pointing the suite at your own app.
  ...(env.START_DEMO_APP
    ? {
        webServer: {
          command: "node demo-app/server.js",
          url: `${env.BASE_URL}/api/health`,
          env: { PORT: new URL(env.BASE_URL).port || "80" },
          reuseExistingServer: !isCi,
          timeout: 30_000,
        },
      }
    : {}),

  projects: [
    {
      name: "unit",
      testDir: "./tests/unit",
    },
    {
      name: "api",
      testDir: "./tests/api",
      use: { baseURL: env.API_BASE_URL ?? env.BASE_URL },
    },
    {
      name: "ui-chromium",
      testDir: "./tests/ui",
      use: desktopChrome,
    },
    {
      name: "e2e-auth",
      testDir: "./tests/e2e/auth",
      use: desktopChrome,
    },

    // ---- Tenant/data bootstrap chain (ordered) ---------------------------
    {
      name: "e2e-setup-workspace",
      testDir: "./tests/e2e/setup",
      testMatch: "**/workspace-create.e2e.spec.ts",
      use: desktopChrome,
    },
    {
      name: "e2e-setup-context",
      testDir: "./tests/e2e/setup",
      testMatch: "**/context-select.e2e.spec.ts",
      dependencies: ["e2e-setup-workspace"],
      use: desktopChrome,
    },

    // ---- Feature specs that need the scoped session ----------------------
    {
      name: "e2e-modules",
      testDir: "./tests/e2e/modules",
      dependencies: ["e2e-setup-context"],
      use: scopedSession,
    },
    {
      // The backend allows ONE claim per user, and every worker shares one
      // login. Any two of these specs running at once — even across files —
      // collide on that slot, so this project runs strictly one at a time.
      // `test.describe.serial` would only order tests inside one file.
      name: "e2e-serial",
      testDir: "./tests/e2e/serial",
      dependencies: ["e2e-setup-context"],
      workers: 1,
      use: scopedSession,
    },

    // ---- RBAC ------------------------------------------------------------
    {
      name: "e2e-rbac-setup",
      testDir: "./tests/e2e/setup",
      testMatch: "**/restricted-user-login.e2e.spec.ts",
      use: desktopChrome,
    },
    {
      name: "e2e-rbac",
      testDir: "./tests/e2e/rbac",
      dependencies: ["e2e-rbac-setup"],
      use: desktopChrome,
    },
  ],
});
