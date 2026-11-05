import fs from "node:fs";
import type {
  Browser,
  BrowserContext,
  Page,
  TestInfo,
} from "@playwright/test";
import { test as base } from "@playwright/test";

type PageClassMap = Record<string, new (page: Page) => unknown>;

export type PageFixtureTypes<M extends PageClassMap> = {
  [K in keyof M]: InstanceType<M[K]>;
};

/**
 * Turns `{ loginPage: LoginPage, itemsPage: ItemsPage }` into Playwright
 * fixtures, replacing the ~5 lines of boilerplate PMD wrote per page object.
 *
 *   export const test = base.extend<PageFixtureTypes<typeof pages>>(
 *     createPageFixtures(pages)
 *   );
 */
export function createPageFixtures<M extends PageClassMap>(map: M) {
  const fixtures: Record<
    string,
    (
      args: { page: Page },
      use: (instance: unknown) => Promise<void>
    ) => Promise<void>
  > = {};

  for (const [name, PageClass] of Object.entries(map)) {
    fixtures[name] = async ({ page }, use) => {
      await use(new PageClass(page));
    };
  }

  return fixtures as unknown as Parameters<
    typeof base.extend<PageFixtureTypes<M>>
  >[0];
}

type StorageStateContextOptions = {
  storageStatePath: string;
  /**
   * `false` (default): throw when the file is missing — the setup project that
   * produces it did not run. `true`: fall back to a fresh anonymous context.
   */
  optional?: boolean;
  /** Message for the missing-file error; tell the reader which project to run. */
  missingMessage?: string;
  /** Skip the test when this returns a reason string (e.g. missing credentials). */
  skipReason?: () => string | undefined;
};

/**
 * Builds a `context` fixture that loads a saved session:
 *
 *   export const authenticatedTest = test.extend({
 *     context: storageStateContext({ storageStatePath: paths.standardUser, optional: true }),
 *   });
 */
export function storageStateContext(options: StorageStateContextOptions) {
  const { storageStatePath, optional = false, missingMessage, skipReason } =
    options;

  return async (
    { browser }: { browser: Browser },
    use: (context: BrowserContext) => Promise<void>,
    testInfo: TestInfo
  ): Promise<void> => {
    const reason = skipReason?.();
    if (reason) testInfo.skip(true, reason);

    const exists = fs.existsSync(storageStatePath);
    if (!exists && !optional) {
      throw new Error(
        missingMessage ??
          `Storage state ${storageStatePath} is missing. Run the setup project that creates it first.`
      );
    }

    const context = await browser.newContext(
      exists ? { storageState: storageStatePath } : {}
    );

    await use(context);
    await context.close();
  };
}
