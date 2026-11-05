import { expect, test } from "@playwright/test";

/**
 * Direct HTTP checks through Playwright's `request` fixture — no browser.
 * Use this tier for contract/status-code checks that don't need the UI.
 */
test.describe("API", () => {
  test("health endpoint is up", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("protected endpoints reject anonymous callers", async ({ request }) => {
    const response = await request.get("/api/workspaces");

    expect(response.status()).toBe(401);
  });

  test("login rejects bad credentials", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { email: "nobody@example.com", password: "wrong" },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid email or password" });
  });
});
