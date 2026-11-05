import { defineConfig, devices } from "@playwright/test";
import { env } from "./qa-automation/src/config/env";

const isCi = env.CI;

const globalTimeout =
  env.PLAYWRIGHT_GLOBAL_TIMEOUT_MS ?? (isCi ? 50 * 60_000 : 0);

const maxFailures = env.PLAYWRIGHT_MAX_FAILURES ?? (isCi ? 5 : undefined);

const desktopChrome = {
  ...devices["Desktop Chrome"],
};

const tenantStorageState = {
  ...desktopChrome,
  storageState: "qa-automation/auth/tenant-context.storage-state.json",
};

export default defineConfig({
  globalSetup: "./qa-automation/src/auth/global-setup.ts",
  testDir: "./qa-automation/tests",

  globalTimeout,
  timeout: isCi ? 60_000 : 30_000,
  maxFailures,

  expect: {
    timeout: 5_000,
  },

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
    // CI runs 2 workers against one Next server; 30s is tight under contention.
    navigationTimeout: isCi ? 60_000 : 30_000,
  },

  projects: [
    {
      name: "api",
      testDir: "./qa-automation/tests/api",
      use: {
        baseURL: env.API_BASE_URL,
      },
    },
    {
      name: "ui-chromium",
      testDir: "./qa-automation/tests/ui",
      use: desktopChrome,
    },
    {
      name: "e2e-chromium",
      testDir: "./qa-automation/tests/e2e/auth",
      use: desktopChrome,
    },
    {
      name: "e2e-client-setup",
      testDir: "./qa-automation/tests/e2e/setup",
      testMatch: "**/client-manager-create.e2e.spec.ts",
      use: desktopChrome,
    },
    {
      name: "e2e-location",
      testDir: "./qa-automation/tests/e2e/setup",
      testMatch: "**/location-manager-create.e2e.spec.ts",
      dependencies: ["e2e-client-setup"],
      use: desktopChrome,
    },
    {
      name: "e2e-tenant-context",
      testDir: "./qa-automation/tests/e2e/setup",
      testMatch: "**/tenant-context-select.e2e.spec.ts",
      dependencies: ["e2e-location"],
      use: desktopChrome,
    },
    {
      name: "e2e-purpose-setup",
      testDir: "./qa-automation/tests/e2e/setup",
      testMatch: "**/purpose-create.e2e.spec.ts",
      dependencies: ["e2e-tenant-context"],
      use: tenantStorageState,
    },
    {
      name: "e2e-schedule-setup",
      testDir: "./qa-automation/tests/e2e/setup",
      testMatch: "**/schedule-*.e2e.spec.ts",
      dependencies: ["e2e-purpose-setup"],
      use: tenantStorageState,
    },
    {
      // After schedule-setup so mergeScheduleManifest cannot race modules' readTenantManifest.
      name: "e2e-modules",
      testDir: "./qa-automation/tests/e2e/modules",
      dependencies: ["e2e-schedule-setup"],
      use: tenantStorageState,
    },
    {
      name: "e2e-public",
      testDir: "./qa-automation/tests/e2e/public",
      dependencies: ["e2e-schedule-setup"],
      use: desktopChrome,
    },
    {
      name: "e2e-events",
      testDir: "./qa-automation/tests/e2e/events",
      // Queue-claim specs run in their own single-worker project below —
      // they share one in-progress-claim-per-user-per-location slot on the
      // backend (see e2e-queue-claim) and cannot safely run alongside it.
      testIgnore: [
        "**/queue-display.e2e.spec.ts",
        "**/queue-process-appointment.e2e.spec.ts",
      ],
      dependencies: ["e2e-public"],
      use: tenantStorageState,
    },
    {
      // Screening claim is capped server-side at one in-progress patient per
      // staff user per location (PatientQueueViewSet.claim). Every E2E
      // worker shares one login, so any two of these specs running at once
      // — even across files/workers — collide on that shared slot. workers:
      // 1 forces them to run strictly one at a time, which is also the
      // product's own intended workflow (one patient in progress at a time).
      name: "e2e-queue-claim",
      testDir: "./qa-automation/tests/e2e/events",
      testMatch: [
        "**/queue-display.e2e.spec.ts",
        "**/queue-process-appointment.e2e.spec.ts",
      ],
      dependencies: ["e2e-public"],
      workers: 1,
      use: tenantStorageState,
    },
    {
      // Logs in the non-superuser from seed-e2e-restricted-user.py and saves
      // its storage state. Independent of the tenant chain (Roles is not
      // tenant-scoped).
      name: "e2e-rbac-setup",
      testDir: "./qa-automation/tests/e2e/setup",
      testMatch: "**/restricted-user-login.e2e.spec.ts",
      use: desktopChrome,
    },
    {
      name: "e2e-rbac",
      testDir: "./qa-automation/tests/e2e/rbac",
      dependencies: ["e2e-rbac-setup"],
      use: desktopChrome,
    },
    {
      name: "e2e-occurrence",
      testDir: "./qa-automation/tests/e2e/occurrence",
      dependencies: ["e2e-tenant-context"],
      use: tenantStorageState,
    },
  ],

  outputDir: "test-results",
});
