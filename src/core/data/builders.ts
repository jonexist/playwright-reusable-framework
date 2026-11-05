import { faker } from "@faker-js/faker";

/**
 * Prefix for every record the suite creates. Makes test data easy to find,
 * filter and bulk-clean in shared lists ("!" sorts first in most tables).
 */
export const E2E_PREFIX = "!E2E";

export function uniqueSuffix(length = 6): string {
  return faker.string.alphanumeric({ length, casing: "upper" });
}

/** `uniqueName("Item")` -> `"!E2E Item 7QK2ZD"`. */
export function uniqueName(label: string, suffixLength = 6): string {
  return `${E2E_PREFIX} ${label} ${uniqueSuffix(suffixLength)}`;
}

/** yyyy-MM-dd in UTC (stable for a given instant regardless of machine TZ). */
export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** yyyy-MM-dd in the machine's LOCAL calendar — use for "today" assertions. */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildEmail(
  parts: { firstName?: string; lastName?: string } = {}
): string {
  return faker.internet.email({
    ...parts,
    provider: "example.com",
    allowSpecialCharacters: false,
  });
}

export function buildUsPhoneDigits(): string {
  return faker.string.numeric(10);
}

export type PersonValues = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phone: string;
};

export function buildPerson(overrides: Partial<PersonValues> = {}): PersonValues {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    email: buildEmail({ firstName, lastName }),
    birthDate: formatIsoDate(
      faker.date.birthdate({ min: 18, max: 80, mode: "age" })
    ),
    phone: buildUsPhoneDigits(),
    ...overrides,
  };
}
