# API Changelog

## 2026-04-26

- Added read-only registry endpoints for manifest, categories, search, entry detail, and per-entry LLM text.
- Added `ETag` support to static registry API responses for cheaper client sync.
- Added `/api/registry/feed` as a lightweight read-only descriptor for downstream builders.
- Added `/api/intent-events` for privacy-light copy/open/install/download/vote intent metrics.
- Added token-protected listing lead review/export with JSON and CSV responses.

All public registry payloads remain read-only and versioned. Editorial content
continues to be sourced from the Git-backed registry, while votes, leads,
placements, jobs, and intent metrics remain dynamic state in `SITE_DB`.
