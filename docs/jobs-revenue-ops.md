# Jobs Revenue Ops

HeyClaude jobs are lead-first and review-gated. The public form is intentionally
short so employers can express interest quickly. Publication remains private
D1-backed review work, and paid jobs cannot be activated until the reviewed row
passes the paid job content-quality gate.

## Intake Policy

- Public required fields: contact name, contact email, company, role title, and
  HTTPS apply URL.
- The message field is optional. Use it for launch timing, preferred tier,
  compensation notes, or context that is not obvious from the apply link.
- Tier selection is intent only. Do not send checkout until role fit and source
  quality are approved.
- Applications stay external. HeyClaude never hosts candidate applications.

## Lead-To-Listing Runbook

1. Review the lead from `/api/admin/listing-leads` or CSV export.
2. Open the canonical employer or ATS apply URL and verify the role is live.
3. Confirm the role fits HeyClaude: Claude, MCP, agents, AI tooling, developer
   infrastructure, automation, or adjacent AI workflow roles.
4. Enrich a private D1 job row with original HeyClaude copy:
   - 120+ character summary
   - 300+ character role detail
   - 3+ responsibilities
   - 3+ requirements
   - 2+ benefits/perks for paid listings
   - compensation, equity, and bonus when published by the employer
   - employment type, source URL, posted date, expiration, and verification date
5. If the role is paid/featured/sponsored, send the approved Polar checkout link.
6. Activate only after review, enrichment, and payment state are correct.
7. Run the source checker every 24-48 hours while listings are active.

## Operator Commands

```bash
ADMIN_API_TOKEN=... pnpm jobs:admin health --base-url https://heyclaude-dev.zeronode.workers.dev
ADMIN_API_TOKEN=... pnpm jobs:admin list --base-url https://heyclaude-dev.zeronode.workers.dev --status pending_review
ADMIN_API_TOKEN=... pnpm jobs:admin upsert --base-url https://heyclaude-dev.zeronode.workers.dev --file job.json
ADMIN_API_TOKEN=... pnpm jobs:admin transition --base-url https://heyclaude-dev.zeronode.workers.dev --slug role-slug --action activate
ADMIN_API_TOKEN=... pnpm jobs:check-sources -- --base-url https://heyclaude-dev.zeronode.workers.dev --apply
```

`HEYCLAUDE_ADMIN_BASE_URL` may be used instead of `--base-url`. The older
`HEYCLOUD_*` aliases are still accepted for local operator compatibility.

## Follow-Up Templates

### Request Missing Role Details

Subject: HeyClaude job listing details for `{role}`

Thanks for sending `{role}`. The apply link is enough to start review. Before we
publish, we need to confirm a few details so the listing is useful and accurate:

- canonical employer or ATS apply URL
- location and remote policy
- employment type
- salary or compensation range if public
- equity, bonus, benefits, or perks if public
- target launch date and preferred listing tier

Applications will stay on your employer/ATS page. HeyClaude prepares the
listing copy from verified source material and sends payment steps only after
review.

### Approved And Checkout Ready

Subject: HeyClaude listing approved for `{role}`

The role fits HeyClaude and is ready for listing prep. Next steps:

- review the prepared summary and public listing facts
- choose placement window and tier
- use the Polar checkout link below after confirming the listing is accurate

Polar checkout: `{polar_checkout_url}`

Payment does not auto-publish the role. We activate the reviewed D1 listing
after payment state and final copy are confirmed.

### Listing Published

Subject: HeyClaude listing is live for `{role}`

Your HeyClaude listing is live:

`{heyclaude_job_url}`

Candidates apply on the employer/ATS page:

`{apply_url}`

We will keep checking the source page during the placement window. Send updates
or closure notices to `{jobs_email}`.

### Renewal Reminder

Subject: HeyClaude listing renewal for `{role}`

The placement window for `{role}` is approaching renewal. If the role is still
open, reply with confirmation or send an updated apply URL/source page. If the
role has closed, we will remove it from active jobs and search-indexable
JobPosting surfaces.

### Stale Or Closed Source

Subject: Source check needed for `{role}`

Our source check could not confirm that `{role}` is still accepting
applications. Please send the current canonical apply URL or confirm the role is
closed. Until confirmed, HeyClaude may mark the listing stale or remove it from
active jobs and sitemap coverage.
