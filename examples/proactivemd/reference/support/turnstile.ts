import { Page } from "@playwright/test";

/**
 * Aborts Cloudflare's Turnstile challenge script so the widget never
 * mounts/solves. Must be called before navigating to the page under test.
 * Used to deterministically exercise the "CAPTCHA not completed" error path
 * without depending on Cloudflare's live "always fails" dummy sitekey.
 */
export async function blockTurnstileChallenge(page: Page): Promise<void> {
  await page.route(
    "**/challenges.cloudflare.com/turnstile/v0/api.js**",
    (route) => route.abort()
  );
}
