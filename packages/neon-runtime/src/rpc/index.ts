/**
 * RPC Function Wrappers
 * 
 * Type-safe wrappers for PostgreSQL RPC functions.
 * These functions use `withClient()` to execute raw SQL queries.
 * 
 * @see packages/neon-runtime/src/services/* for service-level implementations
 * @see packages/neon-runtime/src/rpc/types.ts for return type definitions
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';
import type * as RpcTypes from './types';

/**
 * Calls the database RPC: get_active_announcement
 * 
 * @param p_now - Optional timestamp (defaults to now())
 * @returns Active announcement or null if none
 */
export async function getActiveAnnouncement(
  p_now?: Date | null
): Promise<Record<string, unknown> | null> {
  return withClient(async (client: PoolClient) => {
    const query =
      p_now !== undefined && p_now !== null
        ? 'SELECT * FROM get_active_announcement($1)'
        : 'SELECT * FROM get_active_announcement()';
    const params = p_now !== undefined && p_now !== null ? [p_now] : [];
    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_all_app_settings
 * 
 * @returns All app settings as JSON
 */
export async function getAllAppSettings(): Promise<Record<string, unknown>> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_all_app_settings()');
    return rows[0]?.get_all_app_settings ?? {};
  });
}

/**
 * Calls the database RPC: get_all_content_categories
 * 
 * @returns Array of content categories
 */
export async function getAllContentCategories(): Promise<Array<{ category: string }>> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_all_content_categories()');
    return rows;
  });
}

/**
 * Calls the database RPC: get_all_tags_with_counts
 * 
 * @param p_limit - Optional limit (defaults to 100)
 * @param p_min_count - Optional minimum count (defaults to 1)
 * @returns Array of tags with usage counts
 */
export async function getAllTagsWithCounts(
  p_limit?: number | null,
  p_min_count?: number | null
): Promise<Array<{ tag: string; usage_count: number; categories: string[] }>> {
  return withClient(async (client: PoolClient) => {
    const hasArgs = p_limit !== undefined || p_min_count !== undefined;
    const query = hasArgs
      ? 'SELECT * FROM get_all_tags_with_counts($1, $2)'
      : 'SELECT * FROM get_all_tags_with_counts()';
    const params = hasArgs ? [p_limit ?? null, p_min_count ?? null] : [];
    const { rows } = await client.query(query, params);
    return rows;
  });
}

/**
 * Calls the database RPC: get_api_health
 * 
 * @returns API health status
 */
export async function getApiHealth(): Promise<RpcTypes.ApiHealthResult | null> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_api_health()');
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: generate_metadata_complete
 * 
 * @param p_route - Route path
 * @param p_include - Optional include parameter (defaults to 'metadata')
 * @returns Generated metadata
 */
export async function generateMetadataComplete(
  p_route: string,
  p_include?: string | null
): Promise<Record<string, unknown> | null> {
  return withClient(async (client: PoolClient) => {
    const query =
      p_include !== undefined && p_include !== null
        ? 'SELECT * FROM generate_metadata_complete($1, $2)'
        : 'SELECT * FROM generate_metadata_complete($1)';
    const params =
      p_include !== undefined && p_include !== null ? [p_route, p_include] : [p_route];
    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_changelog_overview
 * 
 * @param p_category - Optional category filter
 * @param p_published_only - Optional published only filter (defaults to true)
 * @param p_featured_only - Optional featured only filter (defaults to false)
 * @param p_limit - Optional limit (defaults to 50)
 * @param p_offset - Optional offset (defaults to 0)
 * @returns Changelog overview result
 */
export async function getChangelogOverview(
  p_category?: string | null,
  p_published_only?: boolean | null,
  p_featured_only?: boolean | null,
  p_limit?: number | null,
  p_offset?: number | null
): Promise<RpcTypes.ChangelogOverviewResult | null> {
  return withClient(async (client: PoolClient) => {
    // Function has default parameters - build query based on provided args
    const params: unknown[] = [];
    let paramIndex = 1;
    let query = 'SELECT * FROM get_changelog_overview(';

    if (p_category !== undefined) {
      query += `$${paramIndex}`;
      params.push(p_category);
      paramIndex++;
    } else {
      query += 'NULL';
    }

    if (p_published_only !== undefined) {
      query += `, $${paramIndex}`;
      params.push(p_published_only);
      paramIndex++;
    } else if (p_featured_only !== undefined || p_limit !== undefined || p_offset !== undefined) {
      query += ', true'; // default
    }

    if (p_featured_only !== undefined) {
      query += `, $${paramIndex}`;
      params.push(p_featured_only);
      paramIndex++;
    } else if (p_limit !== undefined || p_offset !== undefined) {
      query += ', false'; // default
    }

    if (p_limit !== undefined) {
      query += `, $${paramIndex}`;
      params.push(p_limit);
      paramIndex++;
    } else if (p_offset !== undefined) {
      query += ', 50'; // default
    }

    if (p_offset !== undefined) {
      query += `, $${paramIndex}`;
      params.push(p_offset);
    } else if (p_limit !== undefined) {
      query += ', 0'; // default
    }

    query += ')';

    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_changelog_detail
 * 
 * @param p_slug - Changelog entry slug
 * @returns Changelog detail result
 */
export async function getChangelogDetail(
  p_slug: string
): Promise<RpcTypes.ChangelogDetailResult | null> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_changelog_detail($1)', [p_slug]);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_changelog_with_category_stats
 * 
 * @param p_category - Optional category filter
 * @param p_limit - Optional limit (defaults to 1000)
 * @param p_offset - Optional offset (defaults to 0)
 * @returns Changelog with category stats result
 */
export async function getChangelogWithCategoryStats(
  p_category?: string | null,
  p_limit?: number | null,
  p_offset?: number | null
): Promise<RpcTypes.ChangelogWithCategoryStatsResult | null> {
  return withClient(async (client: PoolClient) => {
    // Function has default parameters
    const params: unknown[] = [];
    let paramIndex = 1;
    let query = 'SELECT * FROM get_changelog_with_category_stats(';

    if (p_category !== undefined) {
      query += `$${paramIndex}`;
      params.push(p_category);
      paramIndex++;
    } else {
      query += 'NULL';
    }

    if (p_limit !== undefined) {
      query += `, $${paramIndex}`;
      params.push(p_limit);
      paramIndex++;
    } else if (p_offset !== undefined) {
      query += ', 1000'; // default
    }

    if (p_offset !== undefined) {
      query += `, $${paramIndex}`;
      params.push(p_offset);
    } else if (p_limit !== undefined) {
      query += ', 0'; // default
    }

    query += ')';

    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_company_profile
 * 
 * @param p_slug - Company slug
 * @returns Company profile result
 */
export async function getCompanyProfile(
  p_slug: string
): Promise<RpcTypes.CompanyProfileResult | null> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_company_profile($1)', [p_slug]);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_company_admin_profile
 * 
 * @param p_company_id - Company ID (UUID)
 * @returns Company admin profile
 */
export async function getCompanyAdminProfile(
  p_company_id: string
): Promise<Record<string, unknown> | null> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_company_admin_profile($1)', [
      p_company_id,
    ]);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_companies_list
 * 
 * @param p_limit - Optional limit (defaults to 50)
 * @param p_offset - Optional offset (defaults to 0)
 * @returns Company list result
 */
export async function getCompaniesList(
  p_limit?: number | null,
  p_offset?: number | null
): Promise<RpcTypes.CompanyListResult | null> {
  return withClient(async (client: PoolClient) => {
    const hasArgs = p_limit !== undefined || p_offset !== undefined;
    const query = hasArgs
      ? 'SELECT * FROM get_companies_list($1, $2)'
      : 'SELECT * FROM get_companies_list()';
    const params = hasArgs ? [p_limit ?? null, p_offset ?? null] : [];
    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_community_directory
 * 
 * @param p_search_query - Optional search query
 * @param p_limit - Optional limit (defaults to 100)
 * @returns Community directory result
 */
export async function getCommunityDirectory(
  p_search_query?: string | null,
  p_limit?: number | null
): Promise<RpcTypes.CommunityDirectoryResult | null> {
  return withClient(async (client: PoolClient) => {
    // Function has default parameters: p_search_query (NULL), p_limit (100)
    const hasSearch = p_search_query !== undefined && p_search_query !== null;
    const hasLimit = p_limit !== undefined && p_limit !== null;

    let query = 'SELECT * FROM get_community_directory(';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (hasSearch) {
      query += `$${paramIndex}`;
      params.push(p_search_query);
      paramIndex++;
    } else {
      query += 'NULL';
    }

    if (hasLimit) {
      query += `, $${paramIndex}`;
      params.push(p_limit);
    } else if (hasSearch) {
      query += ', 100'; // default
    }

    query += ')';

    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_user_profile
 * 
 * @param p_user_slug - User slug
 * @param p_viewer_id - Optional viewer user ID (UUID)
 * @returns User profile result
 */
export async function getUserProfile(
  p_user_slug: string,
  p_viewer_id?: string | null
): Promise<RpcTypes.UserProfileResult | null> {
  return withClient(async (client: PoolClient) => {
    const query =
      p_viewer_id !== undefined && p_viewer_id !== null
        ? 'SELECT * FROM get_user_profile($1, $2)'
        : 'SELECT * FROM get_user_profile($1)';
    const params =
      p_viewer_id !== undefined && p_viewer_id !== null
        ? [p_user_slug, p_viewer_id]
        : [p_user_slug];
    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_user_collection_detail
 * 
 * @param p_user_slug - User slug
 * @param p_collection_slug - Collection slug
 * @param p_viewer_id - Optional viewer user ID (UUID)
 * @returns Collection detail with items result
 */
export async function getUserCollectionDetail(
  p_user_slug: string,
  p_collection_slug: string,
  p_viewer_id?: string | null
): Promise<RpcTypes.CollectionDetailWithItemsResult | null> {
  return withClient(async (client: PoolClient) => {
    const query =
      p_viewer_id !== undefined && p_viewer_id !== null
        ? 'SELECT * FROM get_user_collection_detail($1, $2, $3)'
        : 'SELECT * FROM get_user_collection_detail($1, $2)';
    const params =
      p_viewer_id !== undefined && p_viewer_id !== null
        ? [p_user_slug, p_collection_slug, p_viewer_id]
        : [p_user_slug, p_collection_slug];
    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_jobs_list
 * 
 * @returns Array of job listings
 */
export async function getJobsList(): Promise<RpcTypes.JobsListItem[]> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_jobs_list()');
    return rows;
  });
}

/**
 * Calls the database RPC: get_job_detail
 * 
 * @param p_slug - Job slug
 * @returns Job detail result
 */
export async function getJobDetail(p_slug: string): Promise<RpcTypes.JobDetailResult | null> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_job_detail($1)', [p_slug]);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_featured_jobs
 * 
 * @returns Array of featured jobs
 */
export async function getFeaturedJobs(): Promise<RpcTypes.JobsListItem[]> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_featured_jobs()');
    return rows;
  });
}

/**
 * Calls the database RPC: get_jobs_by_category
 * 
 * @param p_category - Job category enum value
 * @returns Array of jobs in the specified category
 */
export async function getJobsByCategory(p_category: string): Promise<RpcTypes.JobsListItem[]> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_jobs_by_category($1)', [p_category]);
    return rows;
  });
}

/**
 * Calls the database RPC: get_jobs_count
 * 
 * @returns Total count of jobs
 */
export async function getJobsCount(): Promise<number> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_jobs_count()');
    return rows[0]?.get_jobs_count ?? 0;
  });
}

/**
 * Calls the database RPC: get_trending_metrics_with_content
 * 
 * @param p_category - Optional content category filter
 * @param p_limit - Optional limit (defaults to 20)
 * @returns Array of trending metrics with content
 */
export async function getTrendingMetricsWithContent(
  p_category?: string | null,
  p_limit?: number | null
): Promise<RpcTypes.TrendingMetricsWithContentResult[]> {
  return withClient(async (client: PoolClient) => {
    // Function has default parameters: p_category (NULL), p_limit (20)
    const hasCategory = p_category !== undefined && p_category !== null;
    const hasLimit = p_limit !== undefined && p_limit !== null;

    let query = 'SELECT * FROM get_trending_metrics_with_content(';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (hasCategory) {
      query += `$${paramIndex}`;
      params.push(p_category);
      paramIndex++;
    } else {
      query += 'NULL';
    }

    if (hasLimit) {
      query += `, $${paramIndex}`;
      params.push(p_limit);
    } else if (hasCategory) {
      query += ', 20'; // default
    }

    query += ')';

    const { rows } = await client.query(query, params);
    return rows;
  });
}

/**
 * Calls the database RPC: get_popular_content
 * 
 * @param p_category - Optional content category filter
 * @param p_limit - Optional limit (defaults to 12)
 * @returns Array of popular content
 */
export async function getPopularContent(
  p_category?: string | null,
  p_limit?: number | null
): Promise<RpcTypes.PopularContentResult[]> {
  return withClient(async (client: PoolClient) => {
    // Function has default parameters: p_category (NULL), p_limit (12)
    const hasCategory = p_category !== undefined && p_category !== null;
    const hasLimit = p_limit !== undefined && p_limit !== null;

    let query = 'SELECT * FROM get_popular_content(';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (hasCategory) {
      query += `$${paramIndex}`;
      params.push(p_category);
      paramIndex++;
    } else {
      query += 'NULL';
    }

    if (hasLimit) {
      query += `, $${paramIndex}`;
      params.push(p_limit);
    } else if (hasCategory) {
      query += ', 12'; // default
    }

    query += ')';

    const { rows } = await client.query(query, params);
    return rows;
  });
}

/**
 * Calls the database RPC: subscribe_newsletter
 * 
 * @param args - Newsletter subscription arguments
 * @returns Subscribe newsletter result
 */
export async function subscribeNewsletter(
  args: {
    p_email: string;
    p_source?: string | null;
    p_referrer?: string | null;
    p_copy_type?: string | null;
    p_copy_category?: string | null;
    p_copy_slug?: string | null;
    p_ip_address?: string | null;
    p_user_agent?: string | null;
    p_resend_contact_id?: string | null;
    p_sync_status?: string | null;
    p_sync_error?: string | null;
    p_engagement_score?: number | null;
    p_primary_interest?: string | null;
    p_total_copies?: number | null;
    p_last_active_at?: string | null;
    p_resend_topics?: string[] | null;
  }
): Promise<RpcTypes.SubscribeNewsletterResult | null> {
  return withClient(async (client: PoolClient) => {
    // Function has many default parameters - pass all with defaults
    const query =
      'SELECT * FROM subscribe_newsletter($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)';
    const params = [
      args.p_email,
      args.p_source ?? 'footer',
      args.p_referrer ?? null,
      args.p_copy_type ?? null,
      args.p_copy_category ?? null,
      args.p_copy_slug ?? null,
      args.p_ip_address ?? null,
      args.p_user_agent ?? null,
      args.p_resend_contact_id ?? null,
      args.p_sync_status ?? 'pending',
      args.p_sync_error ?? null,
      args.p_engagement_score ?? 50,
      args.p_primary_interest ?? null,
      args.p_total_copies ?? 0,
      args.p_last_active_at ?? null,
      args.p_resend_topics ?? null,
    ];
    const { rows } = await client.query(query, params);
    return rows[0] ?? null;
  });
}

/**
 * Calls the database RPC: get_active_subscribers
 * 
 * @returns Array of active subscriber email addresses
 */
export async function getActiveSubscribers(): Promise<string[]> {
  return withClient(async (client: PoolClient) => {
    const { rows } = await client.query('SELECT * FROM get_active_subscribers()');
    return rows.map((row) => row.get_active_subscribers).filter(Boolean);
  });
}
