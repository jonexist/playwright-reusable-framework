import fs from "node:fs";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";
import { env } from "../config/env";
import { loginThroughUI, type Credentials } from "./auth-helper";
import type { LoginOptions } from "../pages/login-page";

export type GlobalSetupUser = {
  name: string;
  /** Return undefined to skip (credentials not configured). */
  credentials: () => Credentials | undefined;
  storageStatePath: string;
  loginOptions?: LoginOptions;
};

/**
 * Logs each configured user in ONCE before the run and saves its session as
 * Playwright storage state, so specs start authenticated instead of paying a
 * UI login each. Users without credentials are skipped silently, which keeps
 * credential-gated specs optional for local runs.
 */
export function createGlobalSetup(users: GlobalSetupUser[]) {
  return async function globalSetup(_config: FullConfig): Promise<void> {
    const active = users
      .map((user) => ({ user, credentials: user.credentials() }))
      .filter(
        (entry): entry is { user: GlobalSetupUser; credentials: Credentials } =>
          Boolean(entry.credentials)
      );

    if (active.length === 0) return;

    const browser = await chromium.launch();

    try {
      for (const { user, credentials } of active) {
        fs.mkdirSync(path.dirname(user.storageStatePath), { recursive: true });

        const context = await browser.newContext({ baseURL: env.BASE_URL });
        const page = await context.newPage();

        try {
          await loginThroughUI(page, credentials, user.loginOptions);
          await context.storageState({ path: user.storageStatePath });
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  };
}
