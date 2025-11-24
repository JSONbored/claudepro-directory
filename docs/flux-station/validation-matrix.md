# Flux Station Validation Matrix

Last updated: 2025-11-23  
Use alongside `docs/flux-station/resilience-audit.md`, `docs/integrations/resend-segment-batching.md`, and `docs/flux-station/subscribe-soak.md`.

## How to use this document
* Each table row summarizes the payload schema, auth expectations, dependencies, side effects, and verification steps for a Flux Station route.
* “Evidence” cells describe what artifacts to attach (logs, dashboards, soak outputs) when validating changes.
* Routes that cannot be exercised locally include alternative validation signals (cron logs, queue heartbeats, etc.).

---

## 1. Email flows

| Endpoint | Payload Schema | Auth / Headers | Data Dependencies | Expected Side Effects | Verification / Evidence |
| --- | --- | --- | --- | --- | --- |
| `POST /flux-station/email/subscribe` | `{ email, copy_category, source, referrer, copy_type }` (see soak spec) | Public, but rate-limited via `email` bucket. Requires `Content-Type: application/json`. | Supabase (newsletter tables), Resend (contacts, topics, segments), Statsig. | New contact row, Resend contact created/updated, cache invalidation log. | Run soak harness (`docs/flux-station/subscribe-soak.md`). Collect artifact JSON/CSV, Supabase logs (no `[resend] segment list throttled`), Resend dashboard screenshot showing engagement tier. |
| `POST /flux-station/email/welcome` | `{ contactId?, email }` (depends on handler defaults). | Public + `email` rate limit. | Resend transactional template, Supabase template data. | Sends welcome email, logs `[email-welcome]`. | Check Resend event stream + Flux Station logs for success. |
| `POST /flux-station/email/transactional` | `{ action, payload }` via handler-specific schema. | Public + `email` bucket. | Supabase job board tables, Resend transactional templates. | Sends job lifecycle or transactional message. | Inspect Resend activity for `action`. Add log screenshot with correlation ID. |
| `POST /flux-station/email/digest` | No body (cron triggers). | `email` bucket; ideally secured by cron secret (not yet). | Supabase content feed, Resend broadcast, RPC `get_weekly_digest`. | Digest queue enqueued, console log `handleDigest`. | Because cron-only: capture pg_cron success email, Supabase log entry, **and** run `supabase rpc get_weekly_digest` (or direct SQL) for current week to confirm rows match email copy; attach screenshot/output. |
| `POST /flux-station/email/sequence` | No body; sequences defined internally. | `email` bucket. | Resend automation flows; Supabase state via RPC `get_due_sequence_emails`. | Sequence step triggered. | Inspect Resend automation stats, confirm `sequence_id` log, and run `supabase rpc get_due_sequence_emails` to ensure returned count matches `sent/failed` metrics. |
| `POST /flux-station/email/count` | `{ }` or query string. | `public` bucket. | Supabase (newsletter count). | Response returns `{ count }`. | Use `curl` from staging; compare with direct Supabase query. |
| `POST /flux-station/email/contact` | `{ email, message, topic }`. | `email` bucket. | Supabase contact/support table, Resend. | Contact row + optional email. | Check Supabase table entry; confirm Resend send when enabled. |
| `POST /flux-station/email/job-lifecycle` | Body required by `handleJobLifecycleEmail`; `X-Email-Action` header sets branch. | `email` bucket + header. | Supabase job board, Resend transactional. | Job lifecycle email event. | Validate header parsing via unit test; verify Resend log entry referencing action. |

---

## 2. Embedding + queue worker endpoints

| Endpoint | Payload Schema | Auth / Headers | Data Dependencies | Expected Side Effects | Verification |
| --- | --- | --- | --- | --- | --- |
| `POST /flux-station/embedding/process` | `handleEmbeddingGenerationQueue` expects queue message payload (internal). | `queueWorker` bucket; typically invoked by queue processor. | Supabase PGMQ `embedding_generation`, embedding provider (OpenAI). | Processes up to batch size messages, logs `processed` count. | Trigger via `/process-queues` or Supabase PG cron; verify queue depth decreased + log entry with `processed`. |
| `POST /flux-station/embedding/webhook` | Provider-specific JSON (OpenAI/other). | `public` bucket; should include provider signature header. | Embedding provider, Supabase storage. | Updates job status, enqueues follow-up tasks. | Replay webhook payload in staging; confirm status update + log referencing request-id. |
| `POST /flux-station/process-queues` | None. | **No auth today** (needs hardening). | Supabase PGMQ, Supabase service role for external queue. | Sequential processing of all registered queues; returns summary JSON. | Hit endpoint manually in staging; capture response + log. Ensure cross-reference with `docs/flux-station/resilience-audit.md`. |

---

## 3. Changelog / Pulse / Cache & RPC routes

| Endpoint | Payload Schema | Auth / Headers | Dependencies | Expected Side Effects | Verification |
| --- | --- | --- | --- | --- | --- |
| `POST /flux-station/changelog-webhook` | Linear/Changelog webhook JSON. | Should include shared secret (currently missing). | Supabase `changelog_process` queue. | Enqueues changelog sync job. | Provide webhook sample + screenshot of queue depth change. |
| `POST /flux-station/pulse` | Optional payload (internal). | `queueWorker` bucket. | PGMQ `pulse`, Statsig, Supabase RPC `batch_insert_user_interactions`. | Updates heartbeat metrics, logs summary. | Check Statsig metrics + queue log, and run a Supabase query/RPC to confirm `batch_insert_user_interactions` inserted expected `inserted/failed` counts (compare to response). |
| `POST /flux-station/changelog/process` | None (cron). | `queueWorker` bucket. | PGMQ `changelog_process`. | Processes changelog entries. | Cron success email + log snippet. |
| `POST /flux-station/changelog/notify` | None (cron). | `queueWorker` bucket. | `changelog_notify` queue, Resend, Discord. | Sends notifications. | Monitor Resend + Discord logs. |
| `POST /flux-station/revalidation` | `{ tag?: string }` or header-driven. | `queueWorker` bucket; should require secret header. | Next.js tag invalidation, Supabase metadata. | Logs `Tags invalidated`. | Capture log + Next.js cache metrics. |

---

## 4. Discord & notifications

| Endpoint | Payload Schema | Auth / Headers | Dependencies | Side Effects | Verification |
| --- | --- | --- | --- | --- | --- |
| `POST /flux-station/discord/jobs` | `{ jobId, action }`. | `queueWorker` bucket. | Discord webhook URL, Supabase jobs table. | Posts embed to Discord channel. | Send staging payload; verify Discord message + Flux Station log referencing webhook response. |
| `POST /flux-station/discord/submissions` | `{ submissionId }`. | `queueWorker`. | Discord webhook, Supabase submissions. | Posts submission digest. | Same as above. |
| `POST /flux-station/discord/direct` | Body depends on `X-Discord-Notification-Type` header. | Requires header + `public` bucket. | Discord webhook(s). | Sends direct notifications. | Provide header sample + screenshot of Discord message. |
| `GET /flux-station/active-notifications*` | Query string filters. | Public GET; may include auth cookie later. | Supabase notifications tables, Statsig. | Returns list of notifications. | Hit endpoint, compare with Supabase query to confirm counts. |
| `POST /flux-station/dismiss*` | `{ notificationId }` or query param. | Public `POST`, but should check auth token. | Supabase update. | Marks notification dismissed. | Execute request with auth header (if available) and confirm DB row changed. |
| `POST /flux-station/notifications/create*` | `{ title, body, audience }`. | Public bucket (should be restricted). | Supabase insert. | Creates notification and optionally triggers push/email. | Validate via Supabase row + log entry. |

---

## 5. External webhook fallback

| Endpoint | Payload Schema | Auth | Dependencies | Side Effects | Verification |
| --- | --- | --- | --- | --- | --- |
| Default `POST` (no route match) | External webhook JSON. | None; relies on `handleExternalWebhook` internal auth. | Determined by `handleExternalWebhook`. | Varies (likely bridging to other services). | Ensure allowlist enforced; add test vector once spec known. |

---

## 6. Non-local / cron-only routes

| Endpoint | Evidence Source | Notes |
| --- | --- | --- |
| `changelog/process`, `changelog/notify`, `/pulse`, `/embedding/process` | pg_cron job history, queue processor logs, `process-queues` response | These run via cron/PGMQ, not manual. Accept cron success email or log snippet showing `queuesProcessed`. |
| `/process-queues` scheduled job | BetterStack heartbeat + Supabase log `Processing X queues` | Manual invocation acceptable in staging; production should rely on cron log. |

---

## 7. Cross-links & references

* Resilience details per route: `docs/flux-station/resilience-audit.md`.
* Resend batching requirements & telemetry: `docs/integrations/resend-segment-batching.md`.
* Subscribe soak harness & monitoring: `docs/flux-station/subscribe-soak.md`.
* Queue processor behavior & runbook: `docs/flux-station/runbook.md` (gating logic and sign-off steps).

Please update this matrix whenever routes change, payloads evolve, or new evidence sources are defined.*** End Patch
