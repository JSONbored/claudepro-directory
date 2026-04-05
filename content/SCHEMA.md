# Content Schema

HeyClaude content is file-backed MDX under `content/<category>/`.

## Shared fields

Every entry should include:

- `title`
- `slug`
- `category`
- `description`
- `cardDescription`
- `repoUrl`
- `author`
- `dateAdded`
- `tags`
- `seoTitle`
- `seoDescription`

## Shared install/usage fields

Use these when applicable:

- `installable`
- `installCommand`
- `usageSnippet`
- `copySnippet`
- `scriptLanguage`

## Category notes

- `mcp`: prefer `installCommand`, `usageSnippet`
- `skills`: prefer `installCommand`, `usageSnippet`
- `hooks`: prefer `usageSnippet`, `copySnippet`
- `statuslines`: prefer `scriptLanguage`, `copySnippet`
- `commands`: prefer `usageSnippet`, `copySnippet`
- `agents` and `rules`: prefer `copySnippet`

## Workflow

1. Run `pnpm migrate:content`
2. Run `pnpm audit:content`
3. Fix any remaining missing required fields
4. Regenerate the README with `pnpm generate:readme`
