/**
 * TEMPLATE — seed the E2E user through an admin HTTP API (any backend).
 *
 * Use when there is no shell access to the app (non-Django stacks, hosted
 * test tenants). Requires a bootstrap admin token available to CI only.
 *
 *   BASE_API_URL=http://localhost:8000 SEED_ADMIN_TOKEN=... \
 *   E2E_USER_FIXTURE=fixtures/e2e-user.json node templates/seed/seed-via-api.mjs
 *
 * Adjust the endpoint and body to your API. Keep it idempotent: treat
 * "already exists" as success and make a follow-up call that resets the
 * password/flags if your API supports it.
 */
import { readFileSync } from "node:fs";

const apiUrl = process.env.BASE_API_URL ?? "http://localhost:8000";
const token = process.env.SEED_ADMIN_TOKEN;
const fixturePath = process.env.E2E_USER_FIXTURE ?? "fixtures/e2e-user.json";

if (!token) {
  console.error("SEED_ADMIN_TOKEN is required");
  process.exit(1);
}

const user = JSON.parse(readFileSync(fixturePath, "utf8"));

const response = await fetch(`${apiUrl}/api/admin/users`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: true,
    mustChangePassword: false,
  }),
});

if (response.status === 409) {
  console.log(`E2E user already exists: ${user.email}`);
} else if (!response.ok) {
  console.error(`Seeding failed: ${response.status} ${await response.text()}`);
  process.exit(1);
} else {
  console.log(`Created E2E user: ${user.email}`);
}
