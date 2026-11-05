import fs from "node:fs";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";
import { hasTestUserCredentials } from "../config/test-data";
import { env } from "../config/env";
import { loginAsDefaultUser } from "./auth-helper";
import { storageStatePaths } from "./storage-state";

async function globalSetup(_config: FullConfig): Promise<void> {
  if (!hasTestUserCredentials()) {
    return;
  }

  const authDir = path.dirname(storageStatePaths.standardUser);
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: env.BASE_URL });
  const page = await context.newPage();

  try {
    await loginAsDefaultUser(page);
    await context.storageState({ path: storageStatePaths.standardUser });
  } finally {
    await browser.close();
  }
}

export default globalSetup;
