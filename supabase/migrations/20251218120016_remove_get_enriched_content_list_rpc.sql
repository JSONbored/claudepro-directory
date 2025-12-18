-- Migration: Remove unused get_enriched_content_list RPC
-- Version: 20251218120016
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_enriched_content_list RPC function - Converted to Prisma
-- ContentService.getEnrichedContentList now uses Prisma directly (line 470), RPC no longer called.
--
-- Function signature: get_enriched_content_list(p_category content_category, p_slugs text[], p_limit integer, p_offset integer)
-- Related: ContentService.getEnrichedContentList uses Prisma $queryRawUnsafe with LEFT JOIN instead

DROP FUNCTION IF EXISTS public.get_enriched_content_list(public.content_category, text[], integer, integer);
