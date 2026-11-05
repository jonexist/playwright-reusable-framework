import { config } from "dotenv";
import { resolve } from "path";
import { z } from "zod";

config({ path: resolve(__dirname, "../../../.env") });

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const placeholderValues = new Set([
    "replace-with-email",
    "replace-with-password",
    "replace-with-user-email",
    "replace-with-user-password",
    "<ask QA lead or assigned owner>",
  ]);

  if (placeholderValues.has(trimmedValue.toLowerCase())) {
    return undefined;
  }

  return trimmedValue;
}

const EnvSchema = z.object({
  APP_NAME: z.string().default("PMD-PLATFORM-UI"),
  PROJECT_NAME: z.string().default("PMD-PLATFORM-UI"),

  BASE_URL: z.url(),
  API_BASE_URL: z.url(),

  CI: z
    .string()
    .optional()
    .default("false")
    .transform((value) => value === "true"),

  RUN_EXAMPLE_TESTS: z
    .string()
    .optional()
    .default("false")
    .transform((value) => value === "true"),

  TEST_WORKERS: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;

      const workers = Number(value);

      if (!Number.isInteger(workers) || workers < 1) {
        throw new Error("TEST_WORKERS must be a positive integer.");
      }

      return workers;
    }),

  HEALTH_ENDPOINT: z.preprocess(optionalTrimmedString, z.string().optional()),

  TEST_USER_EMAIL: z.preprocess(optionalTrimmedString, z.email().optional()),
  TEST_USER_PASSWORD: z.preprocess(
    optionalTrimmedString,
    z.string().optional()
  ),

  /** Non-superuser seeded by seed-e2e-restricted-user.py for RBAC specs. */
  TEST_RESTRICTED_USER_EMAIL: z.preprocess(
    optionalTrimmedString,
    z.email().optional()
  ),
  TEST_RESTRICTED_USER_PASSWORD: z.preprocess(
    optionalTrimmedString,
    z.string().optional()
  ),

  /** Max ms for the entire Playwright run (0 = disabled). */
  PLAYWRIGHT_GLOBAL_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const ms = Number(value);
      if (!Number.isInteger(ms) || ms < 0) {
        throw new Error(
          "PLAYWRIGHT_GLOBAL_TIMEOUT_MS must be a non-negative integer."
        );
      }
      return ms;
    }),

  /** Stop the run after this many failures (CI fail-fast). */
  PLAYWRIGHT_MAX_FAILURES: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const max = Number(value);
      if (!Number.isInteger(max) || max < 1) {
        throw new Error("PLAYWRIGHT_MAX_FAILURES must be a positive integer.");
      }
      return max;
    }),

  LOGIN_PATH: z.string().default("/login"),
  DASHBOARD_PATH: z.string().default("/dashboard"),
});

const runtimeEnv = {
  ...process.env,
  BASE_URL: process.env.BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  API_BASE_URL: process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL,
};

export const env = EnvSchema.parse(runtimeEnv);

export function requireEnvValue(
  value: string | undefined,
  variableName: string
): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${variableName}. Please set it in your local .env file.`
    );
  }

  return value;
}
