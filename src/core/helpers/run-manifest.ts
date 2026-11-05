import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../config/env";

export const CACHE_DIR = path.join(REPO_ROOT, ".cache");

export type RunManifest<T extends Record<string, unknown>> = {
  readonly filePath: string;
  /** Whatever has been written so far (possibly empty). */
  read(): Partial<T>;
  /** Replaces the whole manifest (use from the FIRST setup project of a run). */
  replace(data: Partial<T>): void;
  /** Shallow-merges into the manifest. */
  merge(patch: Partial<T>): void;
  /** Returns the manifest or throws a helpful error naming the missing keys. */
  require<K extends keyof T>(...keys: K[]): T & Required<Pick<T, K>>;
  clear(): void;
};

/**
 * File-backed key/value store that lets an ordered chain of setup projects
 * hand data (created ids, names, slugs) to the specs that depend on them.
 *
 * Writes go through temp file + rename so a parallel reader never observes
 * partial JSON. Pair it with project `dependencies` so only ONE project
 * writes at a time — the manifest is not a lock.
 */
export function createRunManifest<T extends Record<string, unknown>>(options: {
  fileName: string;
  dir?: string;
  /** Hint shown in the error when a required key is missing. */
  setupHint?: string;
}): RunManifest<T> {
  const { fileName, dir = CACHE_DIR, setupHint } = options;
  const filePath = path.join(dir, fileName);

  const read = (): Partial<T> => {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<T>;
  };

  const write = (data: Partial<T>): void => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempPath, filePath);
  };

  return {
    filePath,
    read,
    replace: write,
    merge: (patch) => write({ ...read(), ...patch }),
    require: (...keys) => {
      const current = read();
      const missing = keys.filter(
        (key) => current[key] === undefined || current[key] === null
      );

      if (missing.length > 0) {
        throw new Error(
          `Run manifest ${path.basename(filePath)} is missing: ${missing.map(String).join(", ")}.` +
            (setupHint ? ` ${setupHint}` : "")
        );
      }

      return current as never;
    },
    clear: () => {
      fs.rmSync(filePath, { force: true });
    },
  };
}
