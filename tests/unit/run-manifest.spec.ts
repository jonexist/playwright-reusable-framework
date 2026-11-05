import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createRunManifest } from "../../src/core/helpers/run-manifest";
import { defineStorageStates } from "../../src/core/auth/storage-state";

type Demo = { clientName: string; locationName: string; scheduleId: number };

function tempManifest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"));
  const manifest = createRunManifest<Demo>({
    fileName: "m.json",
    dir,
    setupHint: "Run the setup projects.",
  });
  return { dir, manifest };
}

test.describe("createRunManifest", () => {
  test("reads empty before anything is written", () => {
    const { dir, manifest } = tempManifest();
    expect(manifest.read()).toEqual({});
    fs.rmSync(dir, { recursive: true });
  });

  test("replace overwrites, merge adds keys", () => {
    const { dir, manifest } = tempManifest();

    manifest.replace({ clientName: "A" });
    manifest.merge({ locationName: "L" });
    expect(manifest.read()).toEqual({ clientName: "A", locationName: "L" });

    manifest.replace({ clientName: "B" });
    expect(manifest.read()).toEqual({ clientName: "B" });
    fs.rmSync(dir, { recursive: true });
  });

  test("require returns data or names the missing keys plus the hint", () => {
    const { dir, manifest } = tempManifest();
    manifest.replace({ clientName: "A" });

    expect(manifest.require("clientName").clientName).toBe("A");
    expect(() => manifest.require("clientName", "scheduleId")).toThrow(
      /missing: scheduleId\. Run the setup projects\./
    );
    fs.rmSync(dir, { recursive: true });
  });

  test("leaves no temp files behind after a write", () => {
    const { dir, manifest } = tempManifest();
    manifest.replace({ clientName: "A" });
    manifest.merge({ scheduleId: 1 });

    expect(fs.readdirSync(dir)).toEqual(["m.json"]);
    fs.rmSync(dir, { recursive: true });
  });
});

test.describe("defineStorageStates", () => {
  test("kebab-cases names into *.storage-state.json paths", () => {
    const states = defineStorageStates(["standardUser", "scoped"] as const, "/auth");

    expect(states.standardUser).toBe(
      path.join("/auth", "standard-user.storage-state.json")
    );
    expect(states.scoped).toBe(path.join("/auth", "scoped.storage-state.json"));
  });
});
