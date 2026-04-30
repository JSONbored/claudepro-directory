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

HeyClaude stores canonical `brandDomain` values in registry artifacts and serves public image URLs through HeyClaude paths such as `/api/brand-assets/icon/asana.com`.

The Worker resolves those icons through the Brandfetch Brand Search API using a server-side client ID, then caches the returned image response. Keep the client ID out of source:

- local: `.env.local` or `.dev.vars`
- Cloudflare/CI: secret or environment variable

Supported names:

- `BRANDFETCH_CLIENT_ID`

Generated artifacts should not bake Brandfetch client IDs or transient Brandfetch CDN URLs. They should contain stable HeyClaude asset URLs generated from reviewed `brandDomain` values.

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

Known first-party brands can also be resolved from exact title or tag matches through the curated `KNOWN_BRANDS` registry in `packages/registry/src/brand-assets.js`. Add aliases there only when the domain is unambiguous.

## Validation

Brand URLs must be HTTPS and served by Brandfetch, HeyClaude, or a local reviewed asset path. Arbitrary favicon hotlinks are rejected.
