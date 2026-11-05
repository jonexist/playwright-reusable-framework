import { expect, type Page } from "@playwright/test";

/**
 * Aborts requests matching the given URL globs. Call BEFORE navigating.
 * Use it to take third-party widgets (captcha, analytics, chat) out of the
 * picture so the error path they cause is deterministic.
 */
export async function blockRequests(
  page: Page,
  urlGlobs: string[]
): Promise<void> {
  for (const glob of urlGlobs) {
    await page.route(glob, (route) => route.abort());
  }
}

/**
 * Cloudflare Turnstile: abort the challenge script so the widget never
 * mounts. Exercises the "captcha not completed" path without depending on
 * Cloudflare's live "always fails" dummy sitekey.
 */
export async function blockTurnstileChallenge(page: Page): Promise<void> {
  await blockRequests(page, [
    "**/challenges.cloudflare.com/turnstile/v0/api.js**",
  ]);
}

/**
 * Waits for Turnstile to auto-solve and write its hidden token input. Dummy
 * "always passes" keys still round-trip through Cloudflare, so allow time.
 */
export async function waitForTurnstileToken(
  page: Page,
  timeout = 15_000
): Promise<void> {
  await expect(page.locator('input[name="cf-turnstile-token"]')).not.toHaveValue(
    "",
    { timeout }
  );
}
