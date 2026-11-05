# 06 — Troubleshooting

## CI

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Backend checkout: `Repository not found` | PAT missing, or no access to the private repo | Add `BACKEND_REPO_PAT`; use a classic PAT with `repo` + SSO authorization if a fine-grained one can't see the org |
| `npm ci` fails on a lockfile mismatch | `package.json` and `package-lock.json` drifted | Run `npm install` locally and commit the lockfile |
| Redirected to the change-password page after login | First-login flag not cleared on the seeded user | Seed `first_time_login=false` (or the product's equivalent) |
| Navigation spec finds 0 sidebar links | Wrong user, missing global-setup session, or the test landed on the wrong page | Check secrets match the seed fixture and that global setup logged in |
| Seed script: `KeyError: E2E_USER_JSON` | Fixture file not copied into the container | `docker compose cp` the JSON in before running the script |
| Passes locally, fails in CI | API URL baked into the frontend at build time is wrong | Set `NEXT_PUBLIC_API_URL`-style vars **before** the build step |
| Draft PR never runs tests | By design | Mark Ready for Review |
| `playwright` check "expected, waiting" forever | Required check but the skip job name differs | Both jobs must be named `playwright` |
| "Artifact storage quota has been hit" | Stale artifacts/caches | Purge in Settings → Actions; wait for recalculation; see [04](04-ci-setup.md) |
| Stack up but the first test fails with connection refused | Frontend not ready | `wait-on` the URL before the test step |

## Locally

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Missing required environment variable: TEST_USER_EMAIL` | A spec read a credential getter without a `skip` guard | Set `.env`, or guard with `test.skip(!hasTestUserCredentials(), …)` |
| `Scoped storage state is missing` | A feature spec ran without the setup chain | `npm run test:e2e:setup`, or run through its project (dependencies run automatically) |
| Specs skip with "Set TEST_USER_EMAIL…" | `.env` missing or values are placeholders (`replace-with-…` counts as unset) | `cp .env.example .env` |
| `Run manifest … is missing: …` | Setup project didn't run, or a stale manifest was cleared | Re-run the setup chain; check the `setupHint` text |
| Port already in use on start | Another process on `BASE_URL`'s port | Change the port in `BASE_URL`, or stop the other process. A server already running on that port is **reused** locally (`reuseExistingServer`) |
| Login "fails" but credentials are right | Landed on an unexpected page | `LoginPage` throws the app's own alert text if present; otherwise it reports the URL it landed on — check `POST_LOGIN_PATH` / `expectedPath` |
| A spec passes alone but fails in the full run | Shared state: a non-unique name, or two writers on the manifest | Use `buildXValues()`; make the later setup project depend on the earlier one |
| Two specs fail only in parallel with `409`/"already in progress" | A server-capped resource | Move them to a single-worker project (`e2e-serial`) |

## Flaky-test patterns (and the helper that fixes each)

| Symptom | Cause | Fix |
| --- | --- | --- |
| Row menu closes mid-click | A list refetch re-rendered the row | `clickRowMenuItem` (retries open + click together) |
| Search "finishes" instantly then the table jumps | The matching row was already visible, so the row-based wait fired early | `settleOnMatchingRow` only when the row was *not* visible before typing |
| `waitForResponse` after `goto` times out | The request had already completed (or came from cache) | `waitForDataTableReady` (UI state) instead |
| Combobox input loses text | The option list refetched and remounted the input | `selectComboboxOption` (re-open + re-fill inside `toPass`) |
| Submenu won't open on click | Radix submenus respond to hover | `submenu.hover()` (inside `applyListFilter`) |
| Empty results after a search that "should" match | A query cache held the empty result from before the record existed | Search only **after** creating the record |
| PATCH matcher never fires | The client sent `…/items//42` (double slash) | Matchers tolerate `/+` by default; keep it unless you want strict |

## Inspecting a failure

```bash
npm run test:report                                   # HTML report
npx playwright show-trace test-results/<folder>/trace.zip
npm run test:debug -- --project=e2e-modules -g "<title>"
```

In CI, download the `playwright-html-report` / `playwright-test-results` artifacts
(failure and flaky runs only).
