# Resend Segment Batching – Research & Design

Last updated: 2025-11-23  
Owners: Planner (research), Flux Station Executors (implementation)

## 1. Why this change is needed

* `/flux-station/email/subscribe` frequently emits `[resend] segment list throttled` warnings when 5–10 sign-ups happen rapidly. Each subscription currently:
  1. Lists the contact’s segments (`resend.contacts.segments.list` equivalent).
  2. Removes any managed segments one-by-one via `resend.contacts.segments.remove`.
  3. Adds the target segment with `resend.contacts.segments.add`.
* Every remove/add call flows through `scheduleSegmentApiCall`, which serializes access with a 1.2s minimum interval. Bursty traffic therefore stacks promises and causes user-facing latency plus Resend throttling.
* There is no telemetry capturing the final set of segments or Resend status codes, so we cannot prove correctness after a spike.

## 2. Resend API / SDK capabilities (via Context7 MCP docs)

* Contacts live under audiences (`/audiences/{audienceId}/contacts`). Creation/update APIs accept `unsubscribed` and tags but **do not expose a “segments” array**.
* Topic updates support batch semantics via `contacts.topics.update({ id|email, topics: [{ id, subscription }] })`. Segments, however, currently rely on the `contacts.segments.add/remove` helpers exposed in the Node SDK (no documented bulk “set segments” endpoint).
* Rate limits: pagination endpoints support `limit <= 100`. Contacts update endpoints return `object: 'contact'`, while topic updates respond with the topic ID(s). None of the published docs mention a `contacts.update({ segments })` payload yet.
* Retry semantics: Resend recommends client-side retries with exponential backoff. Our `runWithRetry` wrappers already supply 3 attempts / 500–750ms delays but no circuit breaker or queueing.

**Conclusion:** Today’s public API does **not** provide a single “set segments” call, so Branch B (serialized batching) is the most realistic near-term path. Branch A is documented below in case Resend exposes a bulk endpoint later and we can simplify.

## 3. Current implementation notes (`packages/edge-runtime/src/utils/integrations/resend.ts`)

```408:500:packages/edge-runtime/src/utils/integrations/resend.ts
export async function syncContactSegment(
  resend: Resend,
  contactId: string,
  engagementScore: number,
  options?: SegmentSyncOptions
): Promise<void> {
  ...
  if (mode === 'update') {
    currentSegmentIds = await runWithRetry(() => listSegmentsWithRetry(resend, contactId), ...)
    for (const segmentId of currentSegmentIds) {
      if (typedSegmentId !== targetSegment && managedSegmentIds.has(typedSegmentId)) {
        await runWithRetry(() => resend.contacts.segments.remove({ contactId, segmentId: typedSegmentId }))
      }
    }
  }
  if (shouldAddSegment && targetSegment) {
    await runWithRetry(() => resend.contacts.segments.add({ contactId, segmentId: targetSegment }))
  }
}
```

Pain points:
* Multiple sequential API calls per subscription (list + N removes + add).
* Race condition if two handlers mutate the same contact simultaneously.
* No structured telemetry around `contactId`, `segment_target`, `latency_ms`, or `retry_attempt`.

## 4. Design Branch A – Bulk assignment (future-ready)

_Prerequisite_: Resend exposes either `contacts.update({ segments: [...] })` or `contacts.segments.set({ contactId, segments: [...] })`.

Implementation outline:
1. **Input normalization** – map engagement score to `targetSegment` using existing helper, but also dedupe/validate the final `segments` array.
2. **Single API call** – wrap the new bulk endpoint in `runWithRetry` + `scheduleSegmentApiCall` (if the endpoint is still subject to rate limits).
3. **Telemetry** – log `contactId`, `segments_before`, `segments_after`, `latency_ms`, `retry_attempt`. Attach `mode` (`initial`/`update`).
4. **Unit tests** – mock the SDK to ensure the call is invoked once, ensures typed payload, and handles `null` target segments gracefully.
5. **Rollback plan** – guard behind feature flag `RESEND_SEGMENT_SET_ENABLED`. Roll back to legacy remove/add loop if API degrades.

Benefits:
* O(1) API calls per contact.
* Dramatically reduces time spent inside `scheduleSegmentApiCall`.
* Easier to reason about telemetry (pre/post arrays).

## 5. Design Branch B – Contact-scoped batching (recommended now)

Because no bulk endpoint exists, we add a contact-level queue that deduplicates updates and shares one segment list result.

### 5.1 Proposed primitive

```ts
type SegmentUpdateJob = {
  contactId: string;
  targetSegment: string | null;
  engagementScore: number;
  timestamp: number;
};
```

* Maintain an in-memory `Map<string, SegmentUpdateJob>` inside `resend.ts`. Each call to `syncContactSegment` enqueues/overwrites the job for that contact and schedules a shared worker (Promise chain similar to `segmentLimiterTail`).
* Worker steps:
  1. Drain one job (oldest timestamp).
  2. Fetch current segments once (`listSegmentsWithRetry`).
  3. Compute diff vs `targetSegment`.
  4. Issue removes/adds sequentially but **reuse the fetched list**.
  5. Persist telemetry (success/failure, duration) before moving on.

### 5.2 Hook points

* Reuse `scheduleSegmentApiCall` for actual add/remove HTTP calls, but throttle **per contact** rather than per outer request.
* `runWithRetry` stays as-is, but we record retry counts in logs.
* Introduce `segmentUpdateQueue.enqueue(contactId, targetSegment, engagementScore, mode)` helper that handles dedupe and ensures only one active job per contact.
* Provide optional persistence (e.g., in-memory only for now; future improvement could store outstanding jobs in Supabase or Durable Object if needed).

### 5.3 Additional safeguards

* **Jitter** – keep existing `SEGMENT_MIN_INTERVAL_MS` (1200ms) but randomize per contact to avoid synchronization.
* **Backpressure signal** – expose queue length via structured logs or metrics.
* **Graceful shutdown** – flush outstanding jobs during cron/edge termination by awaiting the tail promise.

## 6. Telemetry & Testing Plan

* Structured log fields: `contactId`, `segment_target`, `engagement_score`, `mode`, `resend_operation`, `latency_ms`, `retry_attempt`, `queue_length` (new).
* Emit counters for:
  - `resend.segment_api.calls` (tagged with `operation=list|add|remove|set`).
  - `resend.segment_api.throttled`.
  - `segment_queue.depth` gauge.
* Unit tests:
  - Ensure dedupe works (two `enqueue` calls for same contact collapse into one add/remove sequence).
  - Validate fallback to legacy path when feature flag disabled.
  - Simulate Resend 429 -> confirm job reruns until retry budget exhausted, then surfaces to DLQ/alert.
* Integration tests (edge runtime):
  - Mock `fetch` to simulate Resend latency and ensure queue waits respect `SEGMENT_MIN_INTERVAL_MS`.
  - Dry-run mode for soak harness (script writes to JSON/CSV without hitting real Resend).

## 7. Success Criteria & Observability

* **Operational**: No `[resend] segment list throttled` logs during 5–10 rapid `handleSubscribe` calls (tracked via soak harness).
* **Functional**: Resend UI shows expected engagement tier for each test contact; telemetry logs contain `segment_target` values matching engagement scores.
* **Performance**: P95 of `/email/subscribe` stays under 800ms even during bursts (after queue introduction).
* **Evidence**: Link soak harness output + Resend dashboard screenshots into the validation matrix.

## 8. Decision checkpoints

| Decision | Owner | Notes |
| --- | --- | --- |
| Approve Branch B queue design | Flux Station lead | Needed before Executors implement queue helper. |
| Switch to Branch A (bulk) if API becomes available | Integrations lead | Requires verifying Resend release + staging test. |
| Feature flag default state | Product/Infra | Start behind `resend.segment_queue.enabled` (off in prod) until soak passes. |

Please append updates when Resend publishes a bulk API or when the queue helper moves from design to implementation.*** End Patch
