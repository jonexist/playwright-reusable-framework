import { expect, Page } from "@playwright/test";
import {
  APP_NAV_MAIN,
  type NavGroupNode,
  type NavNode,
} from "@/shared/navigation/app-nav-manifest";
import { isCatalogPath, normalizeNavHref } from "../navigation/nav-routes";

const MAX_EXPAND_ITERATIONS = 25;

function getTopLevelGroupTitles(nodes: NavNode[] = APP_NAV_MAIN): string[] {
  return nodes
    .filter((node): node is NavGroupNode => node.kind === "group")
    .map((node) => node.title);
}

export class SidebarPage {
  constructor(private readonly page: Page) {}

  get sidebar() {
    return this.page.locator('[data-sidebar="sidebar"]');
  }

  private get mainNavMenu() {
    return this.sidebar
      .locator('[data-slot="sidebar-group-content"]')
      .first()
      .locator('[data-slot="sidebar-menu"]');
  }

  private async expandTopLevelGroups(): Promise<void> {
    for (const title of getTopLevelGroupTitles()) {
      const button = this.mainNavMenu.getByRole("button", {
        name: title,
        exact: true,
      });

      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }

      const collapsible = button.locator(
        "xpath=ancestor::*[@data-slot='collapsible'][1]"
      );
      const state = await collapsible.getAttribute("data-state");

      if (state === "closed") {
        await button.click();
        await expect(collapsible).toHaveAttribute("data-state", "open");
      }
    }
  }

  private async expandNestedClosedGroups(): Promise<void> {
    for (let iteration = 0; iteration < MAX_EXPAND_ITERATIONS; iteration += 1) {
      const closedTriggers = this.sidebar.locator(
        '[data-slot="collapsible"][data-state="closed"] [data-slot="collapsible-trigger"]'
      );
      const triggerCount = await closedTriggers.count();

      if (triggerCount === 0) {
        return;
      }

      let expandedAny = false;

      for (let index = 0; index < triggerCount; index += 1) {
        const trigger = closedTriggers.nth(index);

        try {
          await trigger.scrollIntoViewIfNeeded({ timeout: 2_000 });
          await trigger.click({ timeout: 2_000 });
          expandedAny = true;
          break;
        } catch {
          continue;
        }
      }

      if (!expandedAny) {
        return;
      }
    }
  }

  async expandAllGroups(): Promise<void> {
    await this.expandTopLevelGroups();
    await this.expandNestedClosedGroups();
  }

  async getVisibleCatalogHrefs(): Promise<string[]> {
    await this.expandAllGroups();

    const hrefs = await this.sidebar
      .locator("a[href]")
      .evaluateAll((anchors) =>
        anchors
          .map((anchor) => anchor.getAttribute("href"))
          .filter((href): href is string => Boolean(href))
      );

    const paths = new Set<string>();

    for (const href of hrefs) {
      const path = normalizeNavHref(href);
      if (isCatalogPath(path)) {
        paths.add(path);
      }
    }

    return [...paths].sort();
  }

  async navigateToPath(path: string): Promise<void> {
    await this.expandAllGroups();

    const link = this.sidebar.locator(`a[href="${path}"]`);
    await expect(link).toBeVisible();
    await link.scrollIntoViewIfNeeded();

    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const urlPattern = new RegExp(`${escaped}(?:\\?|#|$)`);

    await link.click();
    await expect(this.page).toHaveURL(urlPattern, { timeout: 15_000 });
  }
}
