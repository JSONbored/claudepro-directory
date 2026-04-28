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

## Brand fields

Use these when a resource has a clear provider, product, or service brand:

- `brandName`
- `brandDomain`
- `brandAssetSource`
- `brandIconUrl`
- `brandLogoUrl`
- `brandVerifiedAt`
- `brandColors`

Important:

- `brandDomain` is the canonical enrichment key. Use the provider domain such as `asana.com`, not GitHub, docs hosting, package registry, or redirect domains.
- `brandAssetSource` should be `brandfetch` for Brandfetch CDN assets, `manual` for reviewed local/manual assets, or omitted when no brand asset is known.
- `brandIconUrl` and `brandLogoUrl` must be HTTPS Brandfetch URLs, HeyClaude/local asset URLs, or omitted. Do not hotlink arbitrary favicons.
- Brand fields are optional for submissions. Maintainers can add or correct them during review.

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
- `tools`: use `websiteUrl`, `pricingModel`, and `disclosure`; products and services should go through `/tools/submit`
- `skills`: prefer `installCommand`, `usageSnippet`
- `hooks`: prefer `trigger`, `usageSnippet`, `copySnippet`
- `statuslines`: prefer `scriptLanguage`, `copySnippet`
- `commands`: prefer `usageSnippet`, `copySnippet`
- `agents` and `rules`: prefer `copySnippet`
- `guides`: avoid treating guides as copy-first assets; prioritize structured walkthrough content
- `collections`: prefer `items`, `installationOrder`, and bundle guidance over `copySnippet`

## Submission paths

- Free Claude resources should start with `/submit` or the generated GitHub issue forms.
- Pull requests are for advanced contributors who can add MDX directly and run the full gate.
- Maintainers manually review and import accepted submissions; issue validation is not auto-publish.
- Tools, apps, services, sponsorships, claims, and jobs use the website lead forms, not content issue templates.
- Contributor links must be official source/docs/release URLs. Affiliate, referral, tracking, or local package-hosting requests are rejected.

## Workflow

1. Run `pnpm validate:content:strict`
2. Run `pnpm validate:issue-templates`
3. Run `pnpm audit:content`
4. Run `pnpm validate:clean`
5. Run `pnpm --filter web run prebuild` to regenerate registry artifacts
6. Run `pnpm test:registry-artifacts`
7. Fix missing fields and semantic audit issues
8. Regenerate issue templates and README when category/content counts change
