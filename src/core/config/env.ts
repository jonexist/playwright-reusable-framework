import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

/** Repo root (src/core/config -> three levels up). */
export const REPO_ROOT = resolve(__dirname, "../../..");

config({ path: resolve(REPO_ROOT, ".env"), quiet: true });

/**
 * Treats blanks and obvious placeholders as "not set" so a half-filled
 * `.env.example` copy skips credential-gated specs instead of failing logins.
 */
const PLACEHOLDER_VALUES = new Set([
  "replace-with-email",
  "replace-with-password",
  "replace-with-user-email",
  "replace-with-user-password",
  "<ask qa lead or assigned owner>",
]);

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) {
    return undefined;
  }

  return trimmed;
}

const booleanString = z
  .string()
  .optional()
  .default("false")
  .transform((value) => value === "true");

function positiveInt(name: string, { allowZero = false } = {}) {
  return z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;

      const parsed = Number(value);
      const min = allowZero ? 0 : 1;
      if (!Number.isInteger(parsed) || parsed < min) {
        throw new Error(
          `${name} must be ${allowZero ? "a non-negative" : "a positive"} integer.`
        );
      }

      return parsed;
    });
}

const EnvSchema = z.object({
  APP_NAME: z.string().default("PLAYWRIGHT-FRAMEWORK"),

  /** Defaults to the bundled demo app so a fresh clone runs without a `.env`. */
  BASE_URL: z.url().default("http://localhost:4173"),
  /** Direct API target for the `api` project. Falls back to BASE_URL. */
  API_BASE_URL: z.preprocess(optionalTrimmedString, z.url().optional()),

  CI: booleanString,

  /** Start the bundled demo app via Playwright `webServer`. Set `false` for a real app. */
  START_DEMO_APP: z
    .string()
    .optional()
    .default("true")
    .transform((value) => value !== "false"),

  TEST_WORKERS: positiveInt("TEST_WORKERS"),
  /** Max ms for the entire run (0 = disabled). */
  PLAYWRIGHT_GLOBAL_TIMEOUT_MS: positiveInt("PLAYWRIGHT_GLOBAL_TIMEOUT_MS", {
    allowZero: true,
  }),
  /** Stop the run after this many failures (CI fail-fast). */
  PLAYWRIGHT_MAX_FAILURES: positiveInt("PLAYWRIGHT_MAX_FAILURES"),

  TEST_USER_EMAIL: z.preprocess(optionalTrimmedString, z.email().optional()),
  TEST_USER_PASSWORD: z.preprocess(optionalTrimmedString, z.string().optional()),

  /** Non-superuser used by RBAC specs. */
  TEST_RESTRICTED_USER_EMAIL: z.preprocess(
    optionalTrimmedString,
    z.email().optional()
  ),
  TEST_RESTRICTED_USER_PASSWORD: z.preprocess(
    optionalTrimmedString,
    z.string().optional()
  ),

  LOGIN_PATH: z.string().default("/login"),
  /** Default landing page after a successful login. */
  POST_LOGIN_PATH: z.string().default("/dashboard"),
  /** Optional forced-password-change interstitial that also counts as "logged in". */
  CHANGE_PASSWORD_PATH: z.preprocess(optionalTrimmedString, z.string().optional()),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

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
