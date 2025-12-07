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

### Profile Reference

| Profile | Stale | Revalidate | Expire | Use Cases |
|---------|-------|------------|--------|-----------|
| `'minutes'` | 5min (300s) | 1min (60s) | 1hr (3600s) | Very frequently changing data (real-time stats, live counters) |
| `'quarter'` | 15min (900s) | 5min (300s) | 2hr (7200s) | Frequently changing data (newsletter counts, search results, company search) |
| `'half'` | 30min (1800s) | 10min (600s) | 3hr (10800s) | Moderately changing data (jobs, companies, content lists, announcements) |
| `'hours'` | 1hr (3600s) | 15min (900s) | 1 day (86400s) | Hourly updates (content detail, search facets, changelog, templates, related content) |
| `'stable'` | 6hr (21600s) | 1hr (3600s) | 7 days (604800s) | Stable data that changes infrequently (navigation menus, site config) |
| `'static'` | 1 day (86400s) | 6hr (21600s) | 30 days (2592000s) | Rarely changing data (SEO metadata, paginated content) |

### When to Use Each Profile

**`'minutes'`** - Use for data that changes very frequently (every few minutes):
- Real-time analytics
- Live counters or metrics
- Currently not used in codebase (consider for future real-time features)

**`'quarter'`** - Use for data that changes every 5-15 minutes:
- Newsletter subscriber counts (`getNewsletterCount`)
- Company search results (`searchCompanies`)
- Any data that needs near-real-time freshness

**`'half'`** - Use for data that changes every 30 minutes to a few hours:
- Job listings (`getJobs`, `getJobBySlug`, `getFeaturedJobs`)
- Company profiles (`getCompanyProfile`, `getCompaniesList`)
- Content category lists (`getContentByCategory`)
- Announcements (`getActiveAnnouncement`)
- Community directory (`getCommunityDirectory`)
- Marketing stats (`getContentDescription`, `getPartnerHeroStats`)

**`'hours'`** - Use for data that changes hourly or every few hours:
- Content detail pages (`getContentDetail`, `getContentDetailCore`, `getContentAnalytics`)
- Search facets (`getSearchFacets`, `getPopularSearches`)
- Changelog entries (`getChangelogOverview`, `getChangelogEntryBySlug`)
- Form field templates (`getSubmissionFormFields`)
- Related/similar content (`getRelatedContent`, `getSimilarContent`)
- Content templates (`getContentTemplates`)
- Contact commands (`getContactCommands`)
- Marketing visitor stats (`getVisitorStats`)

**`'stable'`** - Use for data that changes infrequently (daily or weekly):
- Navigation menus (`getNavigationMenu`)
- Site-wide configuration
- Data that's expensive to compute but rarely changes

**`'static'`** - Use for data that rarely changes (weekly or monthly):
- SEO metadata (`getPageMetadata`, `getPageMetadataWithSchemas`)
- Paginated content (`getPaginatedContent`)
- Data that can be cached for extended periods

### User-Specific Data (`'use cache: private'`)

For user-specific data functions, use custom `cacheLife` values instead of named profiles:

```ts
'use cache: private';
cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
cacheTag(`user-${userId}`);
```

This pattern is used for:
- Account dashboard data (`getAccountDashboard`, `getUserDashboard`)
- User library/bookmarks (`getUserLibrary`, `getUserBookmarksForCollections`)
- User settings (`getUserSettings`, `getUserSponsorships`)
- User activity (`getUserActivitySummary`, `getUserActivityTimeline`)
- User companies (`getUserCompanies`, `getUserCompanyById`)
- User jobs (`getUserJobById`)
- User profiles (`getPublicUserProfile`)
- Collections (`getCollectionDetail`)
- Notifications (`getActiveNotifications`)
- Bookmark/follow status checks (`isBookmarked`, `isFollowing`, `isBookmarkedBatch`, `isFollowingBatch`)

**Why custom values?** User-specific data needs shorter cache times (1min stale, 5min revalidate, 30min expire) to ensure users see their own updates quickly while still benefiting from cross-request caching.

## Migration Summary

**Status:** ✅ Complete - All legacy caching systems have been migrated to Next.js Cache Components.

### Completed Migrations

1. **Removed Legacy Caching Systems:**
   - ✅ `unstable_cache()` - Removed from all data functions
   - ✅ `React.cache()` - Removed from all data functions
   - ✅ `fetchCached` utility - Deleted file and all references
   - ✅ `CACHE_TTL` config - Removed from `unified-config.ts`
   - ✅ `CACHE_INVALIDATION` config - Removed from `unified-config.ts`
   - ✅ `CACHE_BEHAVIOR` config - Removed from `unified-config.ts`
   - ✅ `cache-config.ts` - Deleted entire file
   - ✅ `getCacheTtl()` function - Removed, replaced with `cacheLife()` profiles
   - ✅ `getCacheInvalidateTags()` - Removed, replaced with direct `cacheTag()` calls
   - ✅ Route Segment Config exports - Removed all `dynamic`, `revalidate`, `runtime` exports

2. **Migrated to Cache Components:**
   - ✅ All 75+ async data functions now use `'use cache'` or `'use cache: private'`
   - ✅ All data functions use `cacheLife()` profiles or custom values
   - ✅ All data functions use `cacheTag()` for invalidation
   - ✅ All account/user-specific data uses `'use cache: private'` with per-user tags

3. **PPR Optimizations:**
   - ✅ Category listing pages - Static hero shell, dynamic content streams
   - ✅ Search page - Static header/layout, facets/results stream
   - ✅ Company pages - Static shell, header/jobs/stats stream separately
   - ✅ Jobs listing page - Static hero/filters, jobs list streams
   - ✅ Content detail pages - Core content blocking (LCP), analytics/related stream
   - ✅ Account pages - Sidebar streams in Suspense with cached data

### Cache Invalidation

Cache invalidation is now handled via `revalidateTag()` in server actions:

```ts
import { revalidateTag } from 'next/cache';

export async function updateContent() {
  // Update data...
  
  // Invalidate related cache tags
  revalidateTag('content');
  revalidateTag(`content-${category}`);
  revalidateTag(`content-${slug}`);
}
```

## Partial Prerendering (PPR) Patterns

PPR enables immediate rendering of static shells while dynamic content streams in Suspense boundaries. This improves TTFB and perceived performance.

### Pattern 1: Static Shell with Single Suspense

**Use Case:** Category listing pages, search pages

```tsx
export default async function CategoryPage({ params }) {
  const config = getCategoryConfig(category); // Static config from generated file
  
  // Static shell renders immediately
  return (
    <div>
      <CategoryHeroShell title={config.title} description={config.description}>
        {/* Dynamic content streams in single Suspense */}
        <Suspense fallback={<Skeleton />}>
          <CategoryPageContent category={category} config={config} />
        </Suspense>
      </CategoryHeroShell>
    </div>
  );
}
```

**Example:** `apps/web/src/app/[category]/page.tsx`

### Pattern 2: Static Shell with Multiple Suspense Boundaries

**Use Case:** Company pages, detail pages with multiple data sources

```tsx
export default async function CompanyPage({ params }) {
  // Static shell renders immediately
  return (
    <div>
      <StructuredData route={`/companies/${slug}`} />
      <div>
        {/* Multiple Suspense boundaries for independent streaming */}
        <Suspense fallback={<HeaderSkeleton />}>
          <CompanyHeader slug={slug} />
        </Suspense>
        
        <div className="grid">
          <Suspense fallback={<JobsSkeleton />}>
            <CompanyJobsList slug={slug} />
          </Suspense>
          
          <Suspense fallback={<StatsSkeleton />}>
            <CompanyStats slug={slug} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

**Example:** `apps/web/src/app/companies/[slug]/page.tsx`

### Pattern 3: Blocking Core + Streaming Secondary

**Use Case:** Content detail pages where LCP is critical

```tsx
export default async function DetailPage({ params }) {
  const { category, slug } = await params;
  
  // Core content fetched blocking for optimal LCP
  const coreContent = await getContentDetailCore(category, slug);
  
  // Secondary data as promises for streaming
  const analyticsPromise = getContentAnalytics(category, slug);
  const relatedPromise = getRelatedContent(category, slug);
  
  return (
    <div>
      {/* Core content renders immediately */}
      <UnifiedDetailPage content={coreContent}>
        {/* Analytics streams in Suspense */}
        <Suspense fallback={null}>
          <ViewCountMetadata promise={analyticsPromise} />
        </Suspense>
        
        {/* Related content streams in Suspense */}
        <Suspense fallback={null}>
          <SidebarWithRelated promise={relatedPromise} />
        </Suspense>
      </UnifiedDetailPage>
    </div>
  );
}
```

**Example:** `apps/web/src/app/[category]/[slug]/page.tsx`

### Pattern 4: Static Form + Streaming Data

**Use Case:** Jobs listing page, search pages with filters

```tsx
export default async function JobsPage({ searchParams }) {
  // Static shell (hero, filters) renders immediately
  return (
    <div>
      <HeroSection /> {/* Static */}
      <FilterForm searchParams={searchParams} /> {/* Static */}
      
      {/* Dynamic content streams */}
      <Suspense fallback={<CountSkeleton />}>
        <JobsCountBadge />
      </Suspense>
      
      <Suspense fallback={<ListSkeleton />}>
        <JobsListSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
```

**Example:** `apps/web/src/app/jobs/page.tsx`

### Best Practices

1. **Identify Static Content:** Anything that doesn't depend on request-time data can be in the static shell
2. **Use Suspense Boundaries:** Wrap dynamic data fetching in Suspense for streaming
3. **Cache Data Functions:** All data functions should use `'use cache'` or `'use cache: private'`
4. **Block Critical Content:** For LCP-critical content (like detail page core), fetch blocking
5. **Stream Secondary Content:** Analytics, related content, sidebars can stream independently
6. **Provide Fallbacks:** Always provide meaningful Suspense fallbacks (skeletons, loading states)

## Guidelines

- Keep fetch logic server-only; React components should consume helpers rather than hitting Supabase directly.
- Prefer domain-specific helper names (`getCompanyProfile`, `getActiveNotifications`) over generic loaders.
- Document any new helpers in this folder if they require non-obvious behaviour (e.g., special invalidation rules).
- Use `'use cache'` for public data, `'use cache: private'` for user-specific data.
- Always use `cacheTag()` with meaningful, hierarchical tags for proper invalidation.
- Use named `cacheLife()` profiles for consistency, custom values only for user-specific data.
