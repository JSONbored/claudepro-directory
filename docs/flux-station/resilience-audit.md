# Flux Station Resilience & Queue Audit

Last updated: 2025-11-23

This document inventories every Flux Station route, highlights current rate limiting and dependencies, and captures the queue orchestration + Resend integration risks that must be addressed before Executors begin changes.

## 1. Route Inventory (from `apps/edge/functions/flux-station/index.ts`)

| Route | Path(s) / Methods | Rate Limit Bucket | Handler Highlights | Queues / External Dependencies | Observed Risks |
| --- | --- | --- | --- | --- | --- |
| `email-subscribe` | `/email/subscribe` (`POST`, `OPTIONS`) | `email` | `handleSubscribe` orchestrates contact creation, Resend topic + segment sync, Supabase inserts, cache invalidation. | Resend API (topics, segments), Supabase (profiles/newsletter tables), Statsig for feature flags, internal cache invalidators. | Resend segment loop can throttle; cache invalidation success not logged; soak harness absent. |
| `email-welcome` | `/email/welcome` | `email` | `handleWelcome` triggers welcome campaign send. | Resend transactional send; template storage. | Missing retries/circuit breaker; limited structured logs. |
| `email-transactional` | `/email/transactional` | `email` | `handleTransactional` handles transactional sends (jobs lifecycle, etc.). | Resend transactional API; Supabase lookup. | No explicit timeout instrumentation; shared rate bucket with subscribe could cascade. |
| `email-digest` | `/email/digest` | `email` | `handleDigest` composes weekly digest via Supabase RPC. | Resend broadcast send, Supabase `get_weekly_digest` RPC, app_settings upsert. | RPC failures currently just log; no fallback dataset or alerting; handler invoked without payload and relies on cron so silent failures possible. |
| `email-sequence` | `/email/sequence` | `email` | `handleSequence` drives nurture sequences based on RPC results. | Resend automation endpoints, Supabase `get_due_sequence_emails` RPC. | Missing DLQ/idempotency around the RPC output; no guard if procedure returns duplicates or partial data. |
| `email-count` | `/email/count` | `public` | `handleGetNewsletterCount` returns counts for UI. | Supabase read. | Public bucket may allow scraping; includes Supabase usage but no cache TTL. |
| `email-contact` | `/email/contact` | `email` | `handleContactSubmission` posts inbound contact forms. | Resend, Supabase support tables. | Spam/no auth risk; missing captcha validation. |
| `email-job-lifecycle` | `/email/job-lifecycle` | `email` | `handleJobLifecycleEmail` uses `X-Email-Action` header for branch logic. | Resend, Supabase job board tables. | Header not validated; risk of unexpected actions; no request auth. |
| `embedding-process` | `/embedding/process` | `queueWorker` | `handleEmbeddingGenerationQueue` drains PGMQ tasks. | Supabase PGMQ `embedding_generation`, OpenAI/embedding provider. | Rate bucket shared with other worker routes; currently sequential; DLQ missing. |
| `embedding-webhook` | `/embedding/webhook` | `public` | `handleEmbeddingWebhook` accepts provider callbacks. | External provider webhook verification, Supabase. | Public rate limit may be too open; missing signature validation call-out. |
| `changelog-webhook` | `/changelog-webhook[/]` | `queueWorker` | `handleChangelogSyncRequest` ingest. | Supabase PGMQ `changelog_process`. | Need auth (currently none); risk if exposed publicly. |
| `pulse` | `/pulse[/]` | `queueWorker` | `handlePulse` populates heartbeat queue and batches RPC inserts. | `pulse` queue; Statsig instrumentation; Supabase `batch_insert_user_interactions` RPC. | `rateLimit('queueWorker')` only; consider cron-only auth; RPC errors only logged—no retry/backpressure, so analytics gaps possible. |
| `changelog-process` | `/changelog/process[/]` | `queueWorker` | `handleChangelogProcess`. | `changelog_process` queue. | Sequential, no concurrency controls. |
| `changelog-notify` | `/changelog/notify[/]` | `queueWorker` | `handleChangelogNotify`. | `changelog_notify` queue; Resend & Discord. | Missing retries for Discord webhooks. |
| `discord-jobs` | `/discord/jobs[/]` | `queueWorker` | `handleDiscordJobs`. | Discord webhook, Supabase job data. | Discord rate limits not surfaced; no DLQ on failure. |
| `discord-submissions` | `/discord/submissions[/]` | `queueWorker` | `handleDiscordSubmissions`. | Discord webhook, Supabase submissions. | No response dedup; missing retry/backoff instrumentation. |
| `revalidation` | `/revalidation[/]` | `queueWorker` | `handleRevalidation` invalidates ISR caches. | Next.js cache tags, Supabase metadata. | Should check auth token; currently public queueWorker bucket. |
| `active-notifications` | `/active-notifications*` (`GET`,`HEAD`,`OPTIONS`) | `public` | `handleActiveNotifications`. | Supabase read, Statsig for toggles. | Public bucket allows scraping; consider caching. |
| `dismiss-notifications` | `/dismiss*` | `public` | `handleDismissNotifications`. | Supabase update, Statsig audit. | Dismiss endpoint lacks auth beyond whatever header is in handler. |
| `create-notification` | `/notifications/create*` | `public` | `handleCreateNotification`. | Supabase insert, Statsig. | Should require service role; currently public bucket. |
| `discord-direct` | header-based route (requires `X-Discord-Notification-Type`) | `public` | `handleDiscordDirect`. | Discord webhook(s). | No auth besides header; potential spoof. |
| `process-queues` | `/process-queues[/]` | _None_ | `processAllQueues` sequentially drains all queues. | Supabase service role (PGMQ + external queue endpoints). | No auth, can be invoked externally; long-running job lacks timeout; logs only aggregated results. |
| Default POST | fallback when route not found | n/a | `handleExternalWebhook`. | Configured external webhooks. | Without allowlist risk of abuse; not rate limited beyond default. |

### Observations
* Most routes rely on `rateLimit` buckets but there is no correlation ID propagation; tracing across Resend/Supabase/Discord is manual.
* `/process-queues` intentionally skips rate limiting and auth, exposing the entire queue surface to anyone with URL knowledge.

### Supabase RPC dependencies (Newsletter & Pulse)
| RPC name | Invoked by | Purpose | Risks / validation gaps |
| --- | --- | --- | --- |
| `get_weekly_digest` | `handleDigest` (`/email/digest`) | Fetches content slices for weekly digest email. | No alerting when RPC throws or returns empty payload; digest silently skips if no content. Need health check + validation queries to confirm expected rows. |
| `get_due_sequence_emails` | `handleSequence` (`/email/sequence`) | Returns backlog of nurture emails to send. | No dedupe/idempotency—RPC data could resend same email on retry; lack of telemetry on returned count vs sent count. |
| `batch_insert_user_interactions` | `handlePulse` (`/pulse`) | Bulk inserts user interactions for analytics, updates engagement scoring. | Errors aggregated into array but only logged; no DLQ/backfill instructions if RPC fails, risking PGMQ backlog and engagement decay. |

**RPC validation actions**
1. Add checklist items in validation matrix to run targeted Supabase queries (e.g., confirm digest rows for current week, verify sequence queue counts, confirm pulse RPC inserted rows).
2. Emit structured logs per RPC with `rpc_name`, `args`, `row_count`, `duration_ms`, and include them in soak/validation evidence.
3. Consider adding BetterStack/cron monitors for RPC failures since these routes are often cron-triggered.

## 2. Queue Orchestration Deep Dive (`routes/queue-processor.ts`)

* `QUEUE_REGISTRY` currently contains seven internal queues (`pulse`, `changelog_process`, `changelog_notify`, `discord_jobs`, `discord_submissions`, `revalidation`, `embedding_generation`) and one external queue (`package_generation` via `/functions/v1/...`).
* `checkQueueMetrics` uses `pgmqMetrics` and treats failures as queue_length = 0, meaning noisy metrics hide actual backlog and skip processing.
* All queues are processed sequentially after sorting by `priority`. No adaptive concurrency or per-queue backoff exists; a slow queue blocks others.
* Internal queue handlers receive a fake `POST` request with no body, so handlers cannot introspect queue metadata or deadlines.
* Results only capture `processed` counts if handlers emit JSON with `processed`. Errors bubble up but there is no DLQ per queue, and repeated failures keep reprocessing until cron retries.

**Opportunities**
1. Adaptive backoff per queue: record error streaks, skip queue for `n` minutes after repeated failures instead of hammering.
2. Per-queue concurrency knobs: allow long-running `embedding_generation` to run alongside lighter queues rather than strictly sequential order.
3. DLQ hooks: push failures (payload + error) into `<queue>_dlq` for re-drive.
4. Health endpoint: expose `queue_length`, last success timestamp, and error streak for observability.
5. Metrics gating: treat `pgmqMetrics` failures as warnings but still attempt processing after configurable retries to avoid masked backlog.

## 3. Resend Engagement Pipeline Findings (`packages/edge-runtime/src/utils/integrations/resend.ts`)

* `syncContactSegment` currently:
  - Calls `listSegmentsWithRetry` (`runWithRetry` w/ base delay 500ms).
  - Iterates through all managed segment IDs and removes each individually via `scheduleSegmentApiCall` (serial promise chain with 1.2s min interval + jitter).
  - Adds the target segment using another serialized call.
* There is no timeout around `resend.contacts.segments.*` aside from the outer `runWithRetry` (3 attempts). The underlying SDK call inherits default HTTP timeout; no circuit breaker or burial when Resend is degraded.
* Logging is limited to `[resend] segment list/add/remove throttled` warnings; there are no structured fields for `contactId`, `segment_target`, or latency.
* Race condition risk: if two subscribe events run simultaneously for the same contact, both read the same segment list and issue conflicting add/remove operations, potentially hitting Resend rate limits.
* Engagement telemetry is not persisted; `determineSegmentByEngagement` logic is deterministic but there is no evidence in logs to assert correct segment or fallback.

**Desired Safety Features**
* Circuit breaker / fallback to queue: when Resend returns 429/5xx beyond retry budget, enqueue a recovery job instead of failing the request.
* Structured logging enriched with `contactId`, `segment_target`, `engagement_score`, `retry_attempt`, `resend_status`.
* Correlation IDs propagated from Flux Station request to Resend helper.
* Queue-based backpressure: ability to enqueue segment updates (per contact) so high write bursts do not hammer Resend synchronously.
* Retry telemetry: emit counters for `segments.list`, `segments.remove`, `segments.add` to spot hot paths quickly.

## 4. Hardening Checklist & Recommendations

- [ ] Circuit breaker for external APIs (Resend, Discord, external queues) with configurable retry budgets.
- [ ] Queue health endpoint exposing `queue_length`, `last_success_at`, `error_streak`, and DLQ depth.
- [ ] DLQ strategy per queue (`*_dlq` tables) with documented re-drive steps.
- [ ] Structured logging + correlation IDs across Flux Station, queue processor, and Resend helpers.
- [ ] Per-route auth validation (esp. `/process-queues`, Discord webhooks, notification create/dismiss).
- [ ] Fallback handlers for cache invalidations (e.g., log + requeue when Supabase tags fail).
- [ ] Retry budgets & observability tags (metrics for `rate_limit_bucket`, `queue_name`, `contactId`).
- [ ] Queue watermarks/alerts when `queue_length` exceeds thresholds.
- [ ] Feature flags for any new batching logic so we can revert to legacy path quickly.

Document owners: Planner (this doc) and future Executors updating sections as mitigations land. Link this file from the Project Status Board for easy access.*** End Patch
