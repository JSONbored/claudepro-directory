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

Source templates live in `emails/templates/` and should be copied into Resend
Broadcast drafts for test sends and scheduling. Keep app code limited to
subscription capture and webhook handling.

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

React Email templates are acceptable later, but the current implementation stays
simple: static HTML/plain-text templates copied into Resend Broadcast drafts
with explicit test sends before scheduling. Never send from app code without
previewing the final HTML and plain-text fallback.

## Indexing And Attribution

- Use UTM links when a campaign points to HeyClaude pages:
  `utm_source=newsletter&utm_medium=email&utm_campaign=<slug>`.
- Prefer canonical entry URLs and feed/API docs links over short links.
- Include Resend unsubscribe or preference placeholders in every draft.
