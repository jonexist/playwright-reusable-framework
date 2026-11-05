import { scopedTest } from "../../../src/app/fixtures/test-fixtures";

/**
 * `e2e-serial` runs with `workers: 1`: the server allows ONE claim per user
 * and all workers share one login. This file and `claim-slot-b` both hold the
 * slot; in a parallel project they would race and one would get a 409.
 */
scopedTest.describe("Claim slot A", () => {
  scopedTest("claims and releases the slot", async ({ claimPage }) => {
    await claimPage.goto();
    await claimPage.expectLoaded();
    await claimPage.claim();
    await claimPage.release();
  });
});
