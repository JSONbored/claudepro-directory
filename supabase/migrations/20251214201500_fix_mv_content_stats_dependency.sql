-- Fix mv_content_stats dependency issue
-- 
-- Problem: Migration 20251030044243_recreate_mv_content_stats.sql tries to create
-- mv_content_stats that depends on content_unified, but content_unified doesn't exist
-- (neither in our schema dump nor in production).
--
-- Solution: Create content_unified as a view that unifies content from different sources,
-- OR make mv_content_stats creation conditional/skip it if content_unified doesn't exist.
--
-- Since content_unified doesn't exist in production either, the parent migration is likely
-- outdated. We'll create content_unified as a view that the migration can use.

-- Create content_unified view if it doesn't exist
-- This view unifies content from the content table (since content_unified was likely removed/replaced)
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
  'Unified view of content from the content table. Created to satisfy mv_content_stats dependency.';

-- Now mv_content_stats can be created by the parent migration
-- The parent migration 20251030044243_recreate_mv_content_stats.sql will succeed
-- because content_unified now exists.
