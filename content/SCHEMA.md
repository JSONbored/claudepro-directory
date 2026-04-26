# Content Schema

HeyClaude content is file-backed MDX under `content/<category>/`.

The canonical registry implementation lives in `packages/registry`. Content files remain the editorial source of truth, while the registry package owns category definitions, validation helpers, derived fields, copy text, submission parsing, and public artifact builders.

## Shared fields

Every entry should include:

- `title`
- `slug`
- `category`
- `description`
- `cardDescription`
- `author`
- `dateAdded`
- `tags`
- `seoTitle`
- `seoDescription`

Important:

- `description` is a concise summary, not a feature dump. Keep it short and truthful.
- `repoUrl` is optional. Use it when there is a real upstream repository.
- Do not use the directory repo as a placeholder `repoUrl` for unrelated assets.

## Shared install/usage fields

Use these when applicable:

- `installable`
- `installCommand`
- `usageSnippet`
- `copySnippet`
- `scriptLanguage`
- `trigger`

## Category notes

- `mcp`: prefer `installCommand`, `usageSnippet`
- `skills`: prefer `installCommand`, `usageSnippet`
- `hooks`: prefer `trigger`, `usageSnippet`, `copySnippet`
- `statuslines`: prefer `scriptLanguage`, `copySnippet`
- `commands`: prefer `usageSnippet`, `copySnippet`
- `agents` and `rules`: prefer `copySnippet`
- `guides`: avoid treating guides as copy-first assets; prioritize structured walkthrough content
- `collections`: prefer `items`, `installationOrder`, and bundle guidance over `copySnippet`

## Workflow

1. Run `pnpm migrate:content`
2. Run `pnpm audit:content`
3. Run `pnpm --filter web run prebuild` to regenerate registry artifacts
4. Run `pnpm test:registry-artifacts`
5. Fix missing fields and semantic audit issues
6. Regenerate the README with `pnpm generate:readme`
