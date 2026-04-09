# Jobs Listing Flow (Private B2B)

This repository intentionally keeps paid job operations out of public GitHub submissions.

## Why

- Job postings are commercial/private business data.
- Public issue/PR workflows would expose customer details and pricing context.
- D1 gives us a single low-overhead store for active listings without introducing a heavy backend.

## Current flow

1. Buyer chooses tier via `/jobs/post` (Sponsored, Featured, Standard).
2. Buyer completes checkout in Polar.
3. Buyer sends listing details to `jobs@heyclau.de` with the templated email.
4. Maintainer reviews and inserts approved listing into D1 (`jobs_listings`).
5. Website reads only active, non-expired jobs from D1.

## D1 schema

Defined in:
- [`apps/web/migrations/0002_jobs.sql`](../apps/web/migrations/0002_jobs.sql)

Core controls:
- `tier`: `standard | featured | sponsored`
- `status`: `draft | pending_review | active | closed | archived`
- `source`: `manual | polar | email`
- `external_ref`: unique id for Polar checkout/session/order if used
- `posted_by_email`: required for private follow-up and auditability
- `expires_at`: optional listing expiry

## Security/operations notes

- No customer/private listing files in `content/**`.
- No jobs issue templates.
- Jobs publish is maintainer-controlled via D1 updates only.
- Public UI renders only rows where `status = 'active'` and not expired.
