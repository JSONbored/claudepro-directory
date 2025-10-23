import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sanitizers } from '@/src/lib/security/validators';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

/**
 * Search Page - SearchAction Schema.org Endpoint
 *
 * PURPOSE:
 * - Fulfills SearchAction structured data contract (schema.org/SearchAction)
 * - Provides a canonical search URL for search engines and external tools
 * - Redirects to homepage with search activated client-side
 *
 * ARCHITECTURE DECISION:
 * We use client-side search on the homepage for optimal UX (instant results, no page reloads).
 * This page serves as a bridge for external search integrations while maintaining that UX.
 *
 * SECURITY:
 * - Query sanitization via validators.sanitizeSearchQuery
 * - Length limits (max 200 chars)
 * - XSS prevention through URL encoding
 *
 * PERFORMANCE:
 * - Instant redirect (no data fetching)
 * - Query parameter preserved in URL for client-side hydration
 * - Static generation where possible
 *
 * SEO:
 * - Proper metadata for search result pages
 * - OpenGraph support for social sharing
 * - Canonical URL pattern matching SearchAction schema
 */

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

// Generate metadata for search page
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';

  // Access uncached data before new Date() (Cache Components requirement)
  (await headers()).get('x-cache-marker');

  return generatePageMetadata('/search', { params: { q: query } });
}

/**
 * Search Page Server Component
 *
 * FLOW:
 * 1. Receive query parameter from SearchAction or external link
 * 2. Sanitize and validate query
 * 3. Redirect to homepage with query preserved
 * 4. Homepage client component handles search via useSearch hook
 *
 * NOTE: We redirect instead of rendering here because:
 * - Homepage has all content pre-loaded (better performance)
 * - Unified search experience (one search implementation)
 * - Client-side search provides instant results
 * - Avoids duplicate search logic in two places
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const rawQuery = resolvedParams.q || '';

  // SECURITY: Sanitize query parameter
  // - Removes HTML/script tags
  // - Limits length to 200 characters
  // - Trims whitespace
  const sanitizedQuery = (await sanitizers.sanitizeSearchQuery(rawQuery)).slice(0, 200);

  // Redirect to homepage with search query
  // The homepage client component will:
  // 1. Read the query from URL
  // 2. Activate search mode
  // 3. Display filtered results
  if (sanitizedQuery) {
    // PERFORMANCE: Use permanent redirect (308) for caching
    // Search queries should always go to homepage
    redirect(`/?q=${encodeURIComponent(sanitizedQuery)}`);
  }

  // Empty query - redirect to homepage
  redirect('/');
}
