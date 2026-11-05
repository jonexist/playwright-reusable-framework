import { expect, Page } from "@playwright/test";
import {
  isQueueClaimResponse,
  isQueueReleaseResponse,
} from "../api/api-matchers";
import { appPaths, queueDisplayPageContent } from "../config/test-data";
import { BasePage } from "./base-page";

/**
 * "Being seen by you" only renders once `getSession()` resolves — until then
 * an in-progress entry is labelled with the staff name and carries no button
 * role. Budget for that to land after the queue payload before concluding an
 * in-progress patient is not ours.
 */
const SESSION_USER_SETTLE_MS = 15_000;

export class QueueDisplayPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto(appPaths.queueDisplay);
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: queueDisplayPageContent.heading,
      })
    ).toBeVisible({ timeout: 30_000 });

    // CardTitle is a div (not a heading); title shares a parent with the count badge.
    await expect(
      this.page.getByText(new RegExp(queueDisplayPageContent.waitingColumn))
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      this.page.getByText(new RegExp(queueDisplayPageContent.nowServingColumn))
    ).toBeVisible({ timeout: 15_000 });
  }

  private columnSection(columnTitle: string) {
    return this.page
      .locator("[data-slot='card']")
      .filter({ hasText: columnTitle })
      .first();
  }

  /**
   * A column's entry count badge, scoped to the card header — queue entries
   * render their own badges ("Walk-in", "#1", "You") in the card body, so an
   * unscoped `[data-slot='badge']` matches every one of them. The header
   * badge replaces its loading Skeleton only once the WebSocket payload has
   * rendered, which makes it the signal that real data is on screen.
   */
  private columnCountBadge(columnTitle: string) {
    return this.columnSection(columnTitle).locator(
      "[data-slot='card-header'] [data-slot='badge']"
    );
  }

  async expectPatientWaiting(patientName: string): Promise<void> {
    const waitingSection = this.columnSection(
      queueDisplayPageContent.waitingColumn
    );

    await expect(waitingSection.getByText(patientName).first()).toBeVisible({
      timeout: 60_000,
    });
  }

  async grabPatient(patientName: string): Promise<void> {
    await this.releaseAnyActiveClaim();
    await this.expectPatientWaiting(patientName);

    await this.page.getByText(patientName).first().click();

    const grabButton = this.page.getByRole("button", {
      name: queueDisplayPageContent.grabPatientButton,
    });
    await expect(grabButton).toBeVisible({ timeout: 15_000 });

    // Screening claim is capped server-side at one in-progress patient per
    // staff user per location (PatientQueueViewSet.claim) — the product's
    // own one-patient-at-a-time workflow. Queue-claim specs run in a
    // dedicated single-worker Playwright project (see e2e-queue-claim) so
    // this can never legitimately collide with another spec; a rejected
    // claim here means a real leftover claim, not routine contention, so
    // fail loudly instead of retrying through it.
    const claim = this.page.waitForResponse(
      (response) => isQueueClaimResponse(response) && response.ok(),
      { timeout: 30_000 }
    );
    await grabButton.click();
    await claim;

    // Toast is ephemeral (sonner auto-dismiss/replace); assert the durable
    // state change instead — the Waiting dialog closes once claim succeeds.
    await expect(grabButton).toBeHidden({ timeout: 15_000 });
  }

  /**
   * Release the currently-served patient back to Waiting, from the Now
   * Serving dialog opened by `grabPatient`/`startProcessing`. Frees this
   * shared user's one-in-progress-per-location claim slot for other tests.
   */
  async releasePatient(): Promise<void> {
    const dialog = this.page.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    const releaseButton = dialog.getByRole("button", {
      name: queueDisplayPageContent.releaseButton,
    });
    await expect(releaseButton).toBeEnabled({ timeout: 15_000 });

    const release = this.page.waitForResponse(
      (response) => isQueueReleaseResponse(response) && response.ok(),
      { timeout: 30_000 }
    );
    await releaseButton.click();
    await release;

    await expect(dialog).toBeHidden({ timeout: 15_000 });
  }

  /**
   * Self-heal from a leftover in-progress claim held by this shared E2E
   * login — the backend's one-claim-per-user-per-location cap persists in
   * the database across separate test runs (e.g. an earlier run that
   * claimed a patient and then crashed/failed before Complete Appointment),
   * so a dangling claim here would otherwise permanently block every claim
   * attempt in every future run, not just contend with it transiently.
   */
  private async releaseAnyActiveClaim(): Promise<void> {
    const nowServingSection = this.columnSection(
      queueDisplayPageContent.nowServingColumn
    );

    // The column renders skeletons before the queue payload arrives, so a
    // plain absence check here would skip a leftover claim and let the next
    // claim be rejected. The header count badge replaces its skeleton only
    // once real data has loaded, so gate on that first.
    const countBadge = this.columnCountBadge(
      queueDisplayPageContent.nowServingColumn
    );
    await expect(countBadge).toBeVisible({ timeout: 30_000 });

    if (((await countBadge.textContent()) ?? "").trim() === "0") {
      return;
    }

    // Someone is in progress at this location. Whether it is *us* depends on
    // the session user, which can resolve after the queue payload — wait for
    // the marker rather than sampling it once.
    const mineEntry = nowServingSection
      .getByRole("button")
      .filter({ hasText: queueDisplayPageContent.beingSeenByYou })
      .first();

    const isMine = await mineEntry
      .waitFor({ state: "visible", timeout: SESSION_USER_SETTLE_MS })
      .then(() => true)
      .catch(() => false);

    if (!isMine) {
      return;
    }

    await mineEntry.click();
    await this.releasePatient();
  }

  async expectPatientNowServing(patientName: string): Promise<void> {
    const servingSection = this.columnSection(
      queueDisplayPageContent.nowServingColumn
    );

    await expect(servingSection.getByText(patientName).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  /**
   * Completing screening from the processing wizard moves the patient to
   * Checkout — it does not complete the appointment (see
   * `AppointmentViewSet.complete`: "Leave patient in checkout queue ...
   * Appointment will be completed when checkout is processed normally").
   */
  async expectPatientInCheckout(patientName: string): Promise<void> {
    const checkoutSection = this.columnSection(
      queueDisplayPageContent.checkoutColumn
    );

    await expect(checkoutSection.getByText(patientName).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  async expectPatientNotWaiting(patientName: string): Promise<void> {
    const waitingSection = this.columnSection(
      queueDisplayPageContent.waitingColumn
    );

    // toHaveCount(0) can pass on its very first (non-retried) check — while
    // the column is still showing loading skeletons, no patient names are
    // rendered at all, so this would trivially succeed before the real
    // WebSocket payload ever arrives. The count badge only renders once
    // real (non-skeleton) data has loaded, so require it first.
    await expect(
      this.columnCountBadge(queueDisplayPageContent.waitingColumn)
    ).toBeVisible({ timeout: 30_000 });

    await expect(waitingSection.getByText(patientName)).toHaveCount(0, {
      timeout: 30_000,
    });
  }

  /**
   * Start Processing from the Now Serving dialog opened by `grabPatient`.
   * Scoped to the dialog — the processing wizard overview footer reuses the
   * same label. Returns the appointment id from the resulting URL.
   */
  async startProcessing(): Promise<number> {
    const dialog = this.page.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    const startProcessing = dialog.getByRole("button", {
      name: queueDisplayPageContent.startProcessingButton,
    });
    await expect(startProcessing).toBeEnabled({ timeout: 15_000 });
    await startProcessing.click();

    await this.page.waitForURL(/\/screener\/process\/\d+/, { timeout: 30_000 });

    const match = this.page.url().match(/\/screener\/process\/(\d+)/);
    if (!match) {
      throw new Error(
        `Could not read appointment id from processing URL: ${this.page.url()}`
      );
    }

    return Number(match[1]);
  }
}
