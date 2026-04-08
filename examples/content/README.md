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
pnpm audit:content
pnpm build
```

Important:

- Do not add `viewCount`, `copyCount`, or `popularityScore` to content files.
- Upvotes are owned by D1 and not user-submitted content metadata.
