# `/flux-station/email/subscribe` Soak & Regression Harness

Last updated: 2025-11-23

This document specifies the soak script, monitoring workflow, pass/fail gates, and cleanup steps required to stress `/flux-station/email/subscribe` without risking production data.

## 1. Automation script spec (`apps/edge/scripts/flux-station/subscribe-soak.ts`)

| Flag | Required | Default | Description |
| --- | --- | --- | --- |
| `--iterations` / `-n` | ✅ | 10 | Number of subscription attempts to run. |
| `--baseEmail` / `-e` | ✅ | `ghost@zeronode.sh` | Base alias used to generate unique `ghost+<index>@zeronode.sh` addresses. |
| `--url` / `-u` | ✅ | none | Full Flux Station endpoint, e.g. `https://edge.example.com/flux-station/email/subscribe`. |
| `--delayMs` / `-d` | ☐ | 250 | Jitter to wait between requests (randomized 0–delay). |
| `--topics` | ☐ | `general,agents,jobs,tools` | Comma-separated `copy_category` values to rotate through. |
| `--dryRun` | ☐ | `false` | When true, log payloads without executing HTTP calls (for CI regression). |
| `--output` / `-o` | ☐ | `./soak-artifacts/subscribe-run.json` | Path to write JSON + CSV artifacts. |

**Behavior**
1. Generate unique emails: `${alias}+${timestamp}-${i}@domain`.
2. Cycle through `copy_category` list; attach metadata payload (e.g., `source`, `copy_type`).
3. Perform `fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ... })`.
4. Capture metrics per request:
   * ISO timestamp
   * Payload summary (email, category, source)
   * HTTP status + status text
   * Response duration (ms)
   * Response JSON (if parseable)
   * `request-id` header (if returned)
5. Append entries to both JSON (raw) and CSV (subset) for easier import into spreadsheets/log correlation.
6. Emit summary at end: successes, failures, P95 latency.

**Implementation notes**
* Use `commander` or `yargs` for CLI parsing.
* When `dryRun` is true, still emit synthetic artifacts for regression tests.
* Support `process.env.FLUX_STATION_URL`, `SOAK_BASE_EMAIL`, etc., so CI can inject secrets without CLI flags.

## 2. Runtime monitoring checklist

During each soak run:
1. **Supabase logs**: Tail `[resend]` warnings/errors (`supabase logs --project <id> --service edge`). Ensure no `segment list throttled` entries.
2. **Cache invalidation**: Search for `Tags invalidated` logs in Flux Station output to confirm revalidation fired.
3. **Resend dashboard**:
   * Confirm each `ghost+...` contact shows up under the correct audience.
   * Verify engagement tier/segment matches expectation from `docs/integrations/resend-segment-batching.md`.
   * Check Welcome email event for each contact.
4. **BetterStack heartbeat**: Watch for alerts triggered by the soak; note timestamp if false positives arise.
5. **PGMQ metrics**: Inspect queue depth for `embedding_generation`/newsletter-related queues to ensure soak does not unintentionally fill them.

Document all observations alongside artifact paths.

## 3. Pass/Fail Gates

* **Pass**
  - 100% of soak requests return HTTP 200.
  - No `[resend] segment list throttled` or `[resend] segment add throttled` logs within the Supabase window.
  - Cache invalidation log present at least once (if applicable to categories exercised).
  - Resend dashboard shows the expected engagement tier for each test contact within 2 minutes.
* **Fail**
  - Any HTTP 4xx/5xx from `/email/subscribe`.
  - Resend throttling warnings detected more than once.
  - Missing welcome/confirmation events for any generated email.
  - BetterStack heartbeat alert triggered due to soak.

If failure occurs, preserve artifacts and link into validation matrix + ticket.

## 4. Data reset / cleanup

1. Delete `ghost+...` contacts from Resend (audience UI or API) after validation completes.
2. Remove associated rows from Supabase newsletter tables to prevent analytics skew.
3. Clear cached responses (trigger revalidation) if tests added temporary data to user-facing endpoints.
4. Store soak artifacts in `content/soak-runs/<timestamp>/` (gitignored) for historical comparison, then prune locally.

## 5. Integration with validation matrix & batching doc

* Link the most recent soak artifact and monitoring report under the `/email/subscribe` row inside `docs/flux-station/validation-matrix.md`.
* Reference the batching design doc for telemetry expectations so auditors can tie soak failures to Resend queue decisions.

The Executor responsible for the script should update this doc if CLI flags or monitoring steps change.*** End Patch
