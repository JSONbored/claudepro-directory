# Flux Station Runbook & Decision Log

Last updated: 2025-11-23  
Applies to Planner Steps FS-2 through FS-5.

## 1. Execution order & gating logic

| Step | Description | Dependencies | Gate to proceed |
| --- | --- | --- | --- |
| FS-2 | Newsletter/RPC verification – produce resilience audit, soak harness spec, RPC checklist. | None (entry point). | `docs/flux-station/resilience-audit.md`, `docs/flux-station/subscribe-soak.md`, and `docs/flux-station/validation-matrix.md` email rows reviewed by stakeholders. |
| FS-3 | Resend topic & segment stability – decide on batching path. | FS-2 | `docs/integrations/resend-segment-batching.md` approved; sign-off on Branch B vs A captured below. |
| FS-4 | Embedding queue/DLQ validation – document queue behavior, DLQ plan, re-drive flow. | FS-2 complete (audit) + partial FS-3 (telemetry requirements). | Queue recommendations merged into resilience audit and runbook; DLQ checklist appended to Project Status Board. |
| FS-5 | Full E2E testing & documentation – finalize validation matrix, collect evidence, define sign-off. | FS-2–FS-4 finished. | Validation matrix + soak/report artifacts linked; sign-off owner recorded. |

**Rules**
* Executors may only work on one Project Status Board subtask at a time, in order.
* Any code touching `syncContactSegment` is blocked until FS-3 gates pass.
* `/process-queues` hardening starts only after FS-4 recommendations are documented, even if coding seems straightforward.

## 2. Decision checkpoints & sign-offs

| Decision | Options | Owner | Status |
| --- | --- | --- | --- |
| Resend batching approach | Branch A (bulk API) vs Branch B (contact queue). Branch A requires proof of API availability. | Integrations lead (TBD) | Pending – default to Branch B until Resend exposes bulk set. |
| Feature flag rollout | `resend.segment_queue.enabled` default `false` in prod, `true` in staging/soak. | Product/Infra | Pending. |
| `/process-queues` auth | Require HMAC header or restrict to Supabase cron IP. | Platform owner | Pending review after FS-4 doc. |
| DLQ strategy | PGMQ `_dlq` table vs Supabase table + re-drive script. | Data infra lead | Pending. |

Before code merges, ensure the relevant owner has updated this table or commented in the PR referencing this runbook.

## 3. Global dependencies & secrets

| Secret / Config | Purpose | Location / Owner |
| --- | --- | --- |
| Resend API key (`RESEND_API_KEY`) | Contacts, topics, segments, transactional sends. | Vercel / Supabase edge env – managed by Integrations team. |
| Supabase service role (`SUPABASE_SERVICE_ROLE_KEY`) | Queue processor external fetches, notification writes. | Supabase config – platform owner. |
| Statsig server secret | Feature flagging, metrics for Flux Station. | Shared runtime config – product analytics. |
| Discord webhook URLs | Jobs, submissions, direct notifications. | Secrets store (per channel). |
| BetterStack token | Queue processor heartbeat monitoring. | Infra team. |
| Embedding provider API key (OpenAI or equivalent) | Embedding generation queue + webhook verification. | Edge runtime secrets. |

Document who to contact before running soak or queue scripts; never hard-code secrets in scripts.

## 4. Testing & TDD approach

* **Unit tests**
  - Resend batching helpers: mock Resend SDK to assert dedupe, retries, feature flag toggles.
  - Queue processor enhancements: simulate `pgmqMetrics` failures and ensure adaptive backoff logic triggers.
* **Integration tests**
  - `subscribe-soak.ts` supports `--dryRun`; add CI test verifying metrics logging without HTTP calls.
  - Add regression test harness for `/process-queues` that stubs PGMQ metrics to confirm priority ordering.
* **Manual / Soak**
  - Run subscribe soak harness after any change touching Resend/subscribe path. Attach artifacts to validation matrix row.
  - For queue changes, invoke `/process-queues` in staging and record summary output plus log tail.
* **Observability**
  - Ensure new logs include `contactId`, `segment_target`, `queue_name`, `correlation_id`.
  - Add BetterStack monitors for DLQ depth once implemented.

## 5. Risk mitigations & rollback plan

| Risk | Mitigation | Rollback |
| --- | --- | --- |
| Resend throttling worsens after queue changes | Feature flag new batching logic; keep legacy remove/add path available. | Disable `resend.segment_queue.enabled`, redeploy edge function. |
| `/process-queues` auth lockout | Test new auth header in staging cron first; provide manual override token. | Allowlist previous behavior behind `QUEUE_PROCESSOR_LEGACY_MODE`. |
| DLQ backlog explosion | Implement alerting on `_dlq` queue length; document re-drive script. | Pause queue processor by temporarily removing queue from registry, drain DLQ manually. |
| Missing telemetry for auditors | Structured logging enforced in FS-3/FS-4; validation matrix requires evidence attachments. | Re-run soak/tests with `--dryRun` + logging to regenerate evidence. |

## 6. Sign-off checklist (to complete in FS-5)

1. Validation matrix updated with latest payload + evidence links.
2. Resilience audit checklist items mapped to owners or tickets.
3. Subscribe soak artifacts stored and referenced.
4. Queue processor recommendations ticketed (DLQ, auth, concurrency).
5. Stakeholder (product + infra) acknowledges decision table items.

Keep this runbook synchronized with the Project Status Board so Executors always know current blockers and needed evidence.*** End Patch
