# Content Examples

These example files show the expected frontmatter/body shape for each category.

- `agent.example.mdx`
- `rule.example.mdx`
- `mcp.example.mdx`
- `skill.example.mdx`
- `hook.example.mdx`
- `command.example.mdx`
- `statusline.example.mdx`
- `collection.example.mdx`
- `guide.example.mdx`

Validation commands:

```bash
pnpm validate:content
pnpm validate:issue-templates
pnpm audit:content
pnpm build
```

Important:

- Prefer the public Submit page or GitHub issue forms for free resource submissions.
- Pull requests are welcome for advanced contributors, but accepted content is still maintainer-reviewed before merge.
- Tools, apps, services, sponsored placements, claims, and jobs use the website lead forms rather than content issue templates.
- Contributor-provided affiliate, referral, or tracking URLs are rejected. Use official source, docs, release, or website URLs.
- Do not add `viewCount`, `copyCount`, or `popularityScore` to content files.
- Upvotes are owned by D1 and not user-submitted content metadata.
- Skill entries should include capability metadata (`skillType`, `skillLevel`, `verificationStatus`, `verifiedAt`, `retrievalSources`, `testedPlatforms`).
