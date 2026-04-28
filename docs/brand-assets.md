# Brand Assets

HeyClaude supports optional brand metadata on registry entries so cards, detail pages, API consumers, feeds, and Raycast can show recognizable provider identity without guessing from arbitrary links.

## Fields

- `brandName`: public provider or product name.
- `brandDomain`: canonical provider domain, such as `asana.com`.
- `brandAssetSource`: `brandfetch`, `manual`, `website`, `github`, or `none`.
- `brandIconUrl`: optional reviewed icon URL.
- `brandLogoUrl`: optional reviewed logo URL.
- `brandVerifiedAt`: optional `YYYY-MM-DD` brand metadata review date.
- `brandColors`: optional hex colors.

`brandDomain` is the enrichment key. Do not use GitHub, npm, docs hosting, or redirect domains unless that domain is actually the brand.

## Brandfetch

HeyClaude uses Brandfetch direct CDN URLs when a Brandfetch client ID is configured. Keep the client ID out of source:

- local: `.env.local` or `.dev.vars`
- Cloudflare/CI: secret or environment variable

Supported names:

- `NEXT_PUBLIC_BRANDFETCH_CLIENT_ID`
- `BRANDFETCH_CLIENT_ID`

Generated artifacts can include Brandfetch URLs during prebuild when one of those values is available. The website also uses `NEXT_PUBLIC_BRANDFETCH_CLIENT_ID` as a runtime/build-time fallback when an entry has `brandDomain` but no generated `brandIconUrl`.

## Enrichment

Run a dry-run report:

```bash
pnpm brand:enrich
```

Apply safe `websiteUrl`-derived domains only:

```bash
pnpm brand:enrich -- --apply
```

The script does not auto-apply domains inferred from documentation, GitHub, package registries, or hosting providers. Those remain review-only.

## Validation

Brand URLs must be HTTPS and served by Brandfetch, HeyClaude, or a local reviewed asset path. Arbitrary favicon hotlinks are rejected.
