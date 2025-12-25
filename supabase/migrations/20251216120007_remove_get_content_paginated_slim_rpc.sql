-- Migration: Remove get_content_paginated_slim RPC function
-- Version: 20251216120007
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-16
--
-- Description: Remove get_content_paginated_slim RPC function - converted to Prisma direct query
--
-- This function queried the materialized view mv_content_list_slim with:
--   SELECT columns FROM mv_content_list_slim c
--   WHERE c.category = p_category (optional)
--   ORDER BY p_order_by p_order_direction
--   LIMIT p_limit OFFSET p_offset
--   Plus COUNT(*) OVER() for total_count
--
-- The service now uses Prisma $queryRawUnsafe directly in ContentService.getContentPaginatedSlim():
--   prisma.$queryRawUnsafe(itemsQuery, ...queryParams)
--   Where itemsQuery selects from mv_content_list_slim with window function for count
--
-- Related Changes:
-- - packages/data-layer/src/services/content.ts: Converted getContentPaginatedSlim() to use Prisma
-- - Types defined locally using contentModel (ContentPaginatedSlimItem = contentModel)
DROP FUNCTION IF EXISTS public.get_content_paginated_slim (
  p_category public.content_category,
  p_limit integer,
  p_offset integer,
  p_order_by text,
  p_order_direction text
);
