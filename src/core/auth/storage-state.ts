import path from "node:path";
import { REPO_ROOT } from "../config/env";

export const AUTH_DIR = path.join(REPO_ROOT, "auth");

/**
 * Builds `{ name: <abs path to auth/<kebab-name>.storage-state.json> }`.
 * Generated files are gitignored — never commit them.
 *
 *   const storageStatePaths = defineStorageStates(["standardUser", "scoped"] as const);
 */
export function defineStorageStates<const Names extends readonly string[]>(
  names: Names,
  authDir: string = AUTH_DIR
): Record<Names[number], string> {
  const entries = names.map((name) => {
    const fileName = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    return [name, path.join(authDir, `${fileName}.storage-state.json`)];
  });

  return Object.fromEntries(entries) as Record<Names[number], string>;
}
