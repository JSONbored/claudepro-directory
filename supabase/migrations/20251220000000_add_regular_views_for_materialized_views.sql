-- Migration: Add regular views for materialized views
-- Version: 20251220000000
-- Applied via: Supabase MCP (feature branch: feat_mcp-and-others)
-- Date: 2025-12-20
--
-- Description: Create regular views that read from materialized views
-- This allows Prisma to query materialized views via regular views, providing
-- type safety and IntelliSense while maintaining performance benefits.
--
-- Strategy:
-- - Regular views read from materialized views (pass-through)
-- - Prisma can query regular views with full type safety
-- - Materialized views still provide performance benefits
-- - Views are refreshed when materialized views are refreshed
--
-- Views created:
-- - v_content_list_slim: Reads from mv_content_list_slim
-- - v_trending_searches: Reads from trending_searches
--
-- Related Changes:
-- - prisma/schema.prisma: Add "views" to previewFeatures
-- - packages/data-layer/src/services/content.ts: Update getContentPaginatedSlim to use Prisma queries
-- - packages/data-layer/src/services/search.ts: Update getTrendingSearches to use Prisma queries

-- View for content list slim (reads from materialized view)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for CREATE VIEW, so we use CREATE OR REPLACE
CREATE OR REPLACE VIEW public.v_content_list_slim AS
SELECT * FROM public.mv_content_list_slim;

-- View for trending searches (reads from materialized view)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for CREATE VIEW, so we use CREATE OR REPLACE
CREATE OR REPLACE VIEW public.v_trending_searches AS
SELECT * FROM public.trending_searches;

-- Grant permissions for views (same as materialized views)
GRANT SELECT ON public.v_content_list_slim TO anon, authenticated, service_role;
GRANT SELECT ON public.v_trending_searches TO anon, authenticated, service_role;

-- Add comments for documentation
COMMENT ON VIEW public.v_content_list_slim IS 'Regular view that reads from mv_content_list_slim materialized view. Used by Prisma for type-safe queries. The materialized view must be refreshed manually for data updates.';
COMMENT ON VIEW public.v_trending_searches IS 'Regular view that reads from trending_searches materialized view. Used by Prisma for type-safe queries. The materialized view must be refreshed manually for data updates.';
