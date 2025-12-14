-- Create content_unified view to satisfy migration dependency
-- 
-- Problem: Migration 20251030044243_recreate_mv_content_stats.sql tries to create
-- mv_content_stats that depends on content_unified, but content_unified doesn't exist
-- in production.
--
-- Solution: Create content_unified as a view that selects from the content table.
-- This view includes only columns that exist in the content table and are needed by
-- the migration. The migration uses: category, slug, title, description, author, 
-- tags, created_at, updated_at.

CREATE OR REPLACE VIEW public.content_unified AS
SELECT 
  c.id,
  c.category,
  c.slug,
  c.title,
  c.display_title,
  c.description,
  c.author,
  c.author_profile_url,
  c.tags,
  c.created_at,
  c.updated_at,
  c.date_added,
  c.source,
  c.view_count,
  c.copy_count,
  c.bookmark_count,
  c.popularity_score,
  c.features,
  c.use_cases,
  c.metadata
FROM public.content c;

-- Add comment explaining the view
COMMENT ON VIEW public.content_unified IS 
  'Unified view of content from the content table. Created to satisfy mv_content_stats migration dependency (20251030044243_recreate_mv_content_stats). This view exists solely to allow migration to succeed when creating new branches. No code actually uses this view.';
