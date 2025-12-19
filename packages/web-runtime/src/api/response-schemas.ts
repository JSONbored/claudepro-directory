/**
 * Response Schemas for API Routes
 *
 * Zod schemas for all API route responses.
 * Used for OpenAPI documentation and type safety.
 *
 * @module web-runtime/api/response-schemas
 */

// Import zod-openapi for TypeScript type augmentation (enables .meta() OpenAPI support)
import 'zod-openapi';
import { z } from 'zod';

// =============================================================================
// Common Response Patterns
// =============================================================================

/**
 * Standard success response with data
 */
export const successResponseSchema = z.object({
  success: z.boolean().describe('Operation success status'),
  data: z.unknown().optional().describe('Response data'),
});

/**
 * Standard error response
 * Used for 400, 401, 404, 500, 503 responses
 */
export const errorResponseSchema = z.object({
  error: z.string().describe('Error message'),
  message: z.string().optional().describe('Additional error details'),
});

/**
 * Pagination metadata
 */
export const paginationMetadataSchema = z.object({
  hasMore: z.boolean().describe('Whether more results are available'),
  limit: z.number().int().describe('Number of results per page'),
  offset: z.number().int().describe('Current page offset'),
  total: z.number().int().describe('Total number of results'),
});

// =============================================================================
// Search API Responses
// =============================================================================

/**
 * Search result item (union of all possible result types)
 */
export const searchResultItemSchema = z.object({
  id: z.string().describe('Result item ID'),
  title: z.string().optional().describe('Result item title'),
  slug: z.string().optional().describe('Result item slug'),
  category: z.string().optional().describe('Result item category'),
  description: z.string().optional().describe('Result item description'),
  // Additional fields are dynamic based on result type
}).passthrough();

/**
 * Search API response
 */
export const searchResponseSchema = z.object({
  filters: z.object({
    sort: z.string().optional().describe('Sort order'),
    categories: z.array(z.string()).optional().describe('Filtered categories'),
    tags: z.array(z.string()).optional().describe('Filtered tags'),
    authors: z.array(z.string()).optional().describe('Filtered authors'),
    entities: z.array(z.string()).optional().describe('Filtered entities'),
    job_category: z.string().optional().describe('Job category filter'),
    job_employment: z.string().optional().describe('Job employment type filter'),
    job_experience: z.string().optional().describe('Job experience level filter'),
    job_remote: z.boolean().optional().describe('Job remote filter'),
  }).describe('Applied search filters'),
  pagination: paginationMetadataSchema.describe('Pagination metadata'),
  query: z.string().describe('Search query string'),
  results: z.array(searchResultItemSchema).describe('Search results'),
  searchType: z.enum(['content', 'jobs', 'unified']).describe('Type of search performed'),
});

/**
 * Search autocomplete response
 */
export const searchAutocompleteResponseSchema = z.object({
  query: z.string().describe('Search query'),
  suggestions: z.array(z.object({
    text: z.string().describe('Suggestion text'),
    search_count: z.number().int().optional().describe('Number of searches for this suggestion'),
    is_popular: z.boolean().optional().describe('Whether this suggestion is popular'),
  })).describe('Autocomplete suggestions'),
});

/**
 * Search facets response
 */
export const searchFacetsResponseSchema = z.object({
  facets: z.array(z.object({
    category: z.string().optional().describe('Category name'),
    content_count: z.number().int().optional().describe('Number of content items in this category'),
    tags: z.array(z.string()).optional().describe('Available tags'),
    authors: z.array(z.string()).optional().describe('Available authors'),
  })).describe('Available search facets'),
});

// =============================================================================
// Trending API Responses
// =============================================================================

/**
 * Trending item
 */
export const trendingItemSchema = z.object({
  id: z.string().describe('Item ID'),
  title: z.string().optional().describe('Item title'),
  slug: z.string().optional().describe('Item slug'),
  category: z.string().optional().describe('Item category'),
  popularity_score: z.number().optional().describe('Popularity score'),
  // Additional fields are dynamic
}).passthrough();

/**
 * Trending API response (page mode)
 */
export const trendingPageResponseSchema = z.object({
  items: z.array(trendingItemSchema).describe('Trending items'),
});

/**
 * Trending API response (sidebar mode)
 */
export const trendingSidebarResponseSchema = z.object({
  recent: z.array(trendingItemSchema).describe('Recent items'),
  trending: z.array(trendingItemSchema).describe('Trending items'),
});

// =============================================================================
// Company API Responses
// =============================================================================

/**
 * Company profile response
 */
export const companyProfileResponseSchema = z.object({
  id: z.string().describe('Company ID'),
  name: z.string().describe('Company name'),
  slug: z.string().describe('Company slug'),
  description: z.string().optional().describe('Company description'),
  website: z.string().url().optional().describe('Company website URL').meta({ format: 'uri' }),
  logo_url: z.string().url().optional().describe('Company logo URL').meta({ format: 'uri' }),
  // Additional fields are dynamic
}).passthrough();

// =============================================================================
// Templates API Responses
// =============================================================================

/**
 * Template item
 */
export const templateItemSchema = z.object({
  id: z.string().describe('Template ID'),
  title: z.string().describe('Template title'),
  description: z.string().optional().describe('Template description'),
  category: z.string().describe('Template category'),
  // Additional fields are dynamic
}).passthrough();

/**
 * Templates API response
 */
export const templatesResponseSchema = z.object({
  success: z.boolean().describe('Operation success status'),
  category: z.string().describe('Template category'),
  count: z.number().int().describe('Number of templates'),
  templates: z.array(templateItemSchema).describe('Template items'),
});

// =============================================================================
// Content API Responses
// =============================================================================

/**
 * Content item (for paginated/list responses)
 */
export const contentItemSchema = z.object({
  id: z.string().describe('Content ID'),
  title: z.string().optional().describe('Content title'),
  slug: z.string().optional().describe('Content slug'),
  category: z.string().optional().describe('Content category'),
  description: z.string().optional().describe('Content description'),
  // Additional fields are dynamic
}).passthrough();

/**
 * Paginated content response (array of items)
 */
export const paginatedContentResponseSchema = z.array(contentItemSchema);

/**
 * Content detail response (full content object)
 */
export const contentDetailResponseSchema = contentItemSchema.extend({
  // Full content detail includes all fields
}).passthrough();

/**
 * Category config item
 */
export const categoryConfigItemSchema = z.object({
  category: z.string().describe('Category identifier'),
  display_name: z.string().optional().describe('Category display name'),
  features: z.array(z.string()).optional().describe('Available features for this category'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Category metadata'),
  // Additional fields are dynamic
}).passthrough();

/**
 * Category configs response
 */
export const categoryConfigsResponseSchema = z.array(categoryConfigItemSchema);

/**
 * Sitewide content response (varies by format)
 */
export const sitewideContentResponseSchema = z.union([
  z.string().describe('LLMs.txt format (plain text)'),
  z.object({
    categories: z.array(z.unknown()).optional().describe('Content categories'),
    total_count: z.number().int().optional().describe('Total content count'),
  }).passthrough().describe('README format (JSON)'),
  z.array(contentItemSchema).describe('JSON format (array of content)'),
]);

// =============================================================================
// Changelog API Responses
// =============================================================================

/**
 * Changelog response (text format)
 */
export const changelogResponseSchema = z.string().describe('Changelog in LLMs.txt format');

/**
 * Changelog entry response (text format)
 */
export const changelogEntryResponseSchema = z.string().describe('Changelog entry in LLMs.txt format');

/**
 * Changelog sync response
 */
export const changelogSyncResponseSchema = z.object({
  success: z.boolean().describe('Sync operation success'),
  id: z.string().describe('Changelog entry ID'),
  slug: z.string().describe('Changelog entry slug'),
  message: z.string().describe('Success message'),
});

// =============================================================================
// Bookmarks API Responses
// =============================================================================

/**
 * Bookmark add/remove response (from server action)
 */
export const bookmarkResponseSchema = successResponseSchema.extend({
  data: z.object({
    id: z.string().optional().describe('Bookmark ID'),
    content_slug: z.string().optional().describe('Content slug'),
    content_type: z.string().optional().describe('Content type'),
  }).passthrough().optional(),
});

// =============================================================================
// Stats API Responses
// =============================================================================

/**
 * Social proof stats response
 */
export const socialProofStatsResponseSchema = z.object({
  success: z.boolean().describe('Operation success status'),
  stats: z.object({
    contributors: z.object({
      count: z.number().int().describe('Number of contributors this week'),
      names: z.array(z.string()).describe('Top contributor usernames (up to 5)'),
    }).describe('Contributor statistics'),
    submissions: z.number().int().describe('Number of submissions in past 7 days'),
    successRate: z.number().nullable().describe('Success rate percentage over past 30 days'),
    totalUsers: z.number().int().nullable().describe('Total user count'),
  }).describe('Social proof statistics'),
  timestamp: z.string().datetime().describe('Response timestamp (ISO 8601)').meta({ format: 'date-time' }),
});

// =============================================================================
// Status API Responses
// =============================================================================

/**
 * Health status response
 */
export const statusResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']).describe('API health status'),
  database: z.string().optional().describe('Database connection status'),
  timestamp: z.string().datetime().optional().describe('Status check timestamp (ISO 8601)'),
  version: z.string().optional().describe('API version'),
  // Additional fields are dynamic
}).passthrough();

// =============================================================================
// Sitemap API Responses
// =============================================================================

/**
 * Sitemap XML response (text/xml)
 */
export const sitemapXmlResponseSchema = z.string().describe('Sitemap XML content');

/**
 * Sitemap JSON response
 */
export const sitemapJsonResponseSchema = z.object({
  meta: z.object({
    generated: z.string().datetime().describe('Generation timestamp (ISO 8601)').meta({ format: 'date-time' }),
    total: z.number().int().describe('Total number of URLs'),
  }).describe('Sitemap metadata'),
  urls: z.array(z.object({
    loc: z.string().url().describe('URL location').meta({ format: 'uri' }),
    path: z.string().describe('URL path'),
    lastmod: z.string().optional().describe('Last modification date'),
    changefreq: z.string().optional().describe('Change frequency'),
    priority: z.number().optional().describe('Priority (0.0-1.0)'),
  })).describe('Sitemap URLs'),
});

/**
 * IndexNow submission response
 */
export const indexNowResponseSchema = z.object({
  message: z.string().describe('Response message'),
  ok: z.boolean().describe('Operation success status'),
  submitted: z.number().int().describe('Number of URLs submitted'),
});

// =============================================================================
// Revalidation API Responses
// =============================================================================

/**
 * Revalidation response
 */
export const revalidationResponseSchema = z.object({
  revalidated: z.boolean().describe('Revalidation success status'),
  paths: z.array(z.string()).optional().describe('Revalidated paths'),
  tags: z.array(z.string()).optional().describe('Invalidated cache tags'),
  timestamp: z.string().datetime().describe('Revalidation timestamp (ISO 8601)'),
});

// =============================================================================
// Feeds API Responses
// =============================================================================

/**
 * RSS/Atom feed response (text/xml)
 */
export const feedResponseSchema = z.string().describe('RSS or Atom feed XML content');

// =============================================================================
// OG Image API Responses
// =============================================================================

/**
 * OG image response (binary image/png)
 * Note: This is a binary response, not JSON
 * Using z.any() since ImageResponse returns a binary blob that can't be validated with Zod
 */
export const ogImageResponseSchema = z.any().describe('Open Graph image (PNG binary)');

// =============================================================================
// Inngest API Responses
// =============================================================================

/**
 * Inngest response (delegated to Inngest runtime)
 * Response shape varies based on Inngest function definitions
 */
export const inngestResponseSchema = z.unknown().describe('Inngest function response (varies by function)');

// =============================================================================
// Flux API Responses
// =============================================================================

/**
 * Flux response (delegated to Flux router)
 * Response shape varies based on Flux handler
 */
export const fluxResponseSchema = z.unknown().describe('Flux handler response (varies by handler)');
