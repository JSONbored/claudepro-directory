# Data Layer Structure

All cached reads and repository-wide configuration now live under `src/lib/data`. Each subdirectory maps to a domain:

- `content/` – public content loaders (detail, lists, trending, templates, navigation, related content)
- `companies/` – public vs admin company fetchers
- `account/` – authenticated helpers (user dashboards, submissions, sponsorships)
- `notifications/` – notification fetch/cache helpers
- `forms/` – form field configuration
- `config/` – shared configuration data (constants, category config, cache helpers, static config accessors)
- `marketing/` – partner pricing, manifest copy, site-wide audience metrics, contact channels
- `seo/` – metadata + structured data fetchers (edge SEO API client)

When adding a new cached read:

1. Create a module inside the appropriate domain folder (or a new folder if the domain does not yet exist).
2. Use `'use cache'` or `'use cache: private'` with `cacheLife()` profiles and `cacheTag()` for Cache Components.
3. Export the helper from the domain `index.ts` (or create one) so consumers import from `@/src/lib/data/<domain>`.

## Cache Components Pattern

All data functions use Next.js Cache Components with `cacheLife()` profiles:

```ts
export async function getData() {
  'use cache'; // or 'use cache: private' for user-specific data
  cacheLife('hours'); // Use named profile from next.config.mjs
  cacheTag('data');
  cacheTag(`data-${id}`); // Include dynamic identifiers in tags
  
  // Your data fetching code
  return data;
}
```

Available `cacheLife` profiles (configured in `next.config.mjs`):
- `'minutes'` - 5min stale, 1min revalidate, 1hr expire
- `'quarter'` - 15min stale, 5min revalidate, 2hr expire
- `'half'` - 30min stale, 10min revalidate, 3hr expire
- `'hours'` - 1hr stale, 15min revalidate, 1 day expire
- `'stable'` - 6hr stale, 1hr revalidate, 7 days expire
- `'static'` - 1 day stale, 6hr revalidate, 30 days expire

## Guidelines

- Keep fetch logic server-only; React components should consume helpers rather than hitting Supabase directly.
- Prefer domain-specific helper names (`getCompanyProfile`, `getActiveNotifications`) over generic loaders.
- Document any new helpers in this folder if they require non-obvious behaviour (e.g., special invalidation rules).
