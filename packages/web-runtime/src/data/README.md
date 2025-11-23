# Data Layer Structure

All cached reads and repository-wide configuration now live under `src/lib/data`. Each subdirectory maps to a domain:

- `content/` – public content loaders (detail, lists, trending, templates, navigation, related content)
- `companies/` – public vs admin company fetchers
- `account/` – authenticated helpers (user dashboards, submissions, sponsorships)
- `notifications/` – notification fetch/cache helpers
- `forms/` – form field configuration
- `config/` – shared configuration data (constants, category config, cache helpers, Statsig wrappers)
- `marketing/` – partner pricing, manifest copy, site-wide audience metrics, contact channels
- `seo/` – metadata + structured data fetchers (edge SEO API client)

When adding a new cached read:

1. Create a module inside the appropriate domain folder (or a new folder if the domain does not yet exist).
2. Use `fetchCachedRpc` for any Supabase RPC reads so Statsig TTL/tag behaviour stays consistent.
3. Export the helper from the domain `index.ts` (or create one) so consumers import from `@/src/lib/data/<domain>`.

## Typed Statsig Accessors

Never read from `cacheConfigs()` directly. Instead, use the typed helpers from `src/lib/data/config/cache-config.ts`:

```ts
import { getCacheTtl, getCacheInvalidateTags } from '@/src/lib/data/config/cache-config';

const ttl = await getCacheTtl('cache.content_detail.ttl_seconds');
const tags = await getCacheInvalidateTags('cache.invalidate.content_create');
```

These helpers:

- Provide compile-time key validation via `CacheTtlKey` / `CacheInvalidateKey`
- Return correctly typed values (numbers or `readonly string[]`)
- Handle build-time fallbacks when Statsig isn’t available

If you need the full cache config object (e.g., to prime a promise), use `getCacheConfigSnapshot()` instead of calling `cacheConfigs()` directly.

## Guidelines

- Keep fetch logic server-only; React components should consume helpers rather than hitting Supabase directly.
- Prefer domain-specific helper names (`getCompanyProfile`, `getActiveNotifications`) over generic loaders.
- Document any new helpers in this folder if they require non-obvious behaviour (e.g., special invalidation rules).
