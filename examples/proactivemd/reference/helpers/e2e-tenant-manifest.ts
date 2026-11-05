import fs from "node:fs";
import path from "node:path";

export type E2ETenantManifest = {
  clientName: string;
  employerCode: string;
  locationName: string;
  biometricPurposeName?: string;
  biometricPurposeCode?: string;
  fluShotPurposeName?: string;
  fluShotPurposeCode?: string;
  scheduleName?: string;
  scheduleId?: number;
  scheduleSlug?: string;
  scheduleEventId?: number;
  scheduleEventDate?: string;
  /**
   * Flu-purpose schedule used by processing E2E. Kept separate from
   * `scheduleName`/`scheduleSlug` (biometric) which public registration uses.
   */
  fluScheduleName?: string;
  fluScheduleId?: number;
  fluScheduleSlug?: string;
  fluScheduleEventId?: number;
  fluScheduleEventDate?: string;
};

type ClientManifestPartial = Pick<
  E2ETenantManifest,
  "clientName" | "employerCode"
>;

type LocationManifestPartial = Pick<E2ETenantManifest, "locationName">;

export type PurposeManifestPartial = Pick<
  E2ETenantManifest,
  | "biometricPurposeName"
  | "biometricPurposeCode"
  | "fluShotPurposeName"
  | "fluShotPurposeCode"
>;

export type ScheduleManifestPartial = Pick<
  E2ETenantManifest,
  | "scheduleName"
  | "scheduleId"
  | "scheduleSlug"
  | "scheduleEventId"
  | "scheduleEventDate"
  | "fluScheduleName"
  | "fluScheduleId"
  | "fluScheduleSlug"
  | "fluScheduleEventId"
  | "fluScheduleEventDate"
>;

const manifestPath = path.resolve(
  __dirname,
  "../../.cache/e2e-tenant-manifest.json"
);

function ensureCacheDir(): void {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
}

function readManifestFile(): Partial<E2ETenantManifest> {
  if (!fs.existsSync(manifestPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Partial<E2ETenantManifest>;
}

/** Write via temp + rename so concurrent readers never see partial JSON. */
function writeManifestFile(data: Partial<E2ETenantManifest>): void {
  ensureCacheDir();
  const payload = JSON.stringify(data, null, 2);
  const tempPath = `${manifestPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, payload, "utf8");
  fs.renameSync(tempPath, manifestPath);
}

export function readClientFromManifest(): ClientManifestPartial {
  const manifest = readManifestFile();

  if (!manifest.clientName || !manifest.employerCode) {
    throw new Error(
      "E2E tenant manifest is missing client data. Run the e2e-client-setup project first (yarn test:e2e:setup)."
    );
  }

  return {
    clientName: manifest.clientName,
    employerCode: manifest.employerCode,
  };
}

export function writeClientManifest(data: ClientManifestPartial): void {
  writeManifestFile(data);
}

export function mergeLocationManifest(data: LocationManifestPartial): void {
  writeManifestFile({ ...readManifestFile(), ...data });
}

export function mergePurposeManifest(data: PurposeManifestPartial): void {
  writeManifestFile({ ...readManifestFile(), ...data });
}

export function mergeScheduleManifest(data: ScheduleManifestPartial): void {
  writeManifestFile({ ...readManifestFile(), ...data });
}

export function readTenantManifest(): E2ETenantManifest {
  const manifest = readManifestFile();

  if (!manifest.clientName || !manifest.employerCode) {
    throw new Error(
      "E2E tenant manifest is missing client data. Run the e2e-client-setup project first (yarn test:e2e:setup)."
    );
  }

  if (!manifest.locationName) {
    throw new Error(
      "E2E tenant manifest is missing location data. Run the e2e-location project first (yarn test:e2e:setup)."
    );
  }

  return manifest as E2ETenantManifest;
}
