import { scopedTest } from "../../../src/app/fixtures/test-fixtures";

scopedTest.describe("Claim slot B", () => {
  scopedTest("claims and releases the slot", async ({ claimPage }) => {
    await claimPage.goto();
    await claimPage.expectLoaded();
    await claimPage.claim();
    await claimPage.release();
  });
});
