# Resend Newsletter Playbook

Do not restart campaigns until the registry, API, Raycast, and artifact gates
are stable on the release branch.

## Audience Policy

- Use Resend Audiences and Topics for all marketing sends.
- Keep preference and unsubscribe handling inside Resend.
- Segment subscribers by source when available: site CTA, submit flow, Raycast,
  maintainer, sponsor/partner.
- Default cadence: at most one high-signal digest every two weeks.

## Template Set

React Email source templates live in `emails/src/`. Rendered HTML and plain-text
artifacts live in `emails/templates/` and should be copied into Resend Broadcast
drafts for test sends and scheduling. Keep app code limited to subscription
capture and webhook handling.

### Curated Drop Digest

Subject: `New HeyClaude picks: {{TOPIC}}`

Use for a small set of newly added or newly verified entries. Include:

- one featured entry with direct HeyClaude link
- 3-5 compact links grouped by category
- one maintainer note or submission CTA
- unsubscribe/preferences footer from Resend

### Release Notes

Subject: `HeyClaude registry update: {{VERSION_OR_DATE}}`

Use only for meaningful product or registry changes. Include:

- registry/API/Raycast changes that affect users
- new compatibility formats or exports
- deprecation or migration notes
- link to API docs or changelog

### Maintainer Call

Subject: `Help review new HeyClaude submissions`

Use sparingly for community maintenance. Include:

- review queue theme
- exact issue labels or queue link
- clear maintainer ask
- no paid placement language

## Build Notes

- Run `pnpm email:render` after editing React Email source templates.
- Run `pnpm validate:emails` before release to ensure rendered artifacts are
  current.
- Run `pnpm resend:sync-templates -- --dry-run` to preview the Resend Template
  create/update operations without requiring an API key.
- Run `RESEND_API_KEY=... pnpm resend:sync-templates -- --apply` only when you
  want to upload the current rendered templates into the Resend Templates
  dashboard.
- Store existing Resend template IDs in ignored local env when updating
  templates:
  - `RESEND_TEMPLATE_CURATED_DROP_ID`
  - `RESEND_TEMPLATE_RELEASE_NOTES_ID`
  - `RESEND_TEMPLATE_MAINTAINER_CALL_ID`
- Optional alias overrides can also live in ignored local env:
  - `RESEND_TEMPLATE_CURATED_DROP_ALIAS`
  - `RESEND_TEMPLATE_RELEASE_NOTES_ALIAS`
  - `RESEND_TEMPLATE_MAINTAINER_CALL_ALIAS`
- Resend Broadcast drafts should use the synced dashboard templates or the
  rendered HTML/plain-text output from `emails/templates/`.
- Review and publish templates in the Resend dashboard before using them in a
  Broadcast.
- Never send from app code without previewing the final HTML and plain-text
  fallback.

The sync command only calls Resend Templates endpoints. It does not call Resend
Emails, Broadcasts, or scheduling endpoints, and it does not publish templates.
Broadcast creation, test sends, scheduling, and final sends stay manual inside
Resend.

## Cloudflare Position

- Do not add Cloudflare cron campaign sends or serverless newsletter send
  workers to the site app.
- Cloudflare Workers Cron can be considered later for non-send jobs such as
  registry digest draft generation, stale-link checks, IndexNow retry checks,
  or partner-feed refreshes.
- Cloudflare Email Workers can be considered later for inbound workflows such
  as claim/update routing, but Resend remains the subscriber, template, sending,
  unsubscribe, and deliverability system of record.

## Indexing And Attribution

- Use UTM links when a campaign points to HeyClaude pages:
  `utm_source=newsletter&utm_medium=email&utm_campaign=<slug>`.
- Prefer canonical entry URLs and feed/API docs links over short links.
- Include Resend unsubscribe or preference placeholders in every draft.
