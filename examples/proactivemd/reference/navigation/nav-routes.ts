import {
  APP_NAV_MAIN,
  APP_NAV_SECONDARY,
  buildNavAppPermissionEntries,
  type NavNode,
} from "@/shared/navigation/app-nav-manifest";
import { NAV_APP_CATALOG_PATHS } from "@/shared/permissions/nav-app-permissions";

export type ManifestEntry = ReturnType<
  typeof buildNavAppPermissionEntries
>[number];

const entriesByPath = new Map(
  buildNavAppPermissionEntries().map((entry) => [entry.path, entry])
);

function findGroupTrail(
  nodes: NavNode[],
  targetPath: string,
  trail: string[] = []
): string[] | null {
  for (const node of nodes) {
    if (node.kind === "link") {
      if (node.path === targetPath) {
        return trail;
      }
      continue;
    }

    const found = findGroupTrail(node.items, targetPath, [
      ...trail,
      node.title,
    ]);
    if (found) {
      return found;
    }
  }

  return null;
}

export function getManifestEntryByPath(
  path: string
): ManifestEntry | undefined {
  return entriesByPath.get(path);
}

export function buildGroupTrailForPath(path: string): string[] {
  const mainTrail = findGroupTrail(APP_NAV_MAIN, path);
  if (mainTrail) {
    return mainTrail;
  }

  const isSecondary = APP_NAV_SECONDARY.some((item) => item.path === path);
  return isSecondary ? [] : [];
}

export function isCatalogPath(path: string): boolean {
  return NAV_APP_CATALOG_PATHS.has(path);
}

const secondaryNavPaths = new Set(APP_NAV_SECONDARY.map((item) => item.path));

/** Secondary links do not set aria-current (unlike main nav). */
export function isSecondaryNavPath(path: string): boolean {
  return secondaryNavPaths.has(path);
}

export function normalizeNavHref(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return new URL(href).pathname.replace(/\/$/, "") || "/";
  }

  const pathname = href.split(/[?#]/)[0] ?? href;
  return pathname.replace(/\/$/, "") || "/";
}
