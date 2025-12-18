-- Migration: Remove unused get_trending_searches RPC
-- Version: 20251218120021
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_trending_searches RPC function - Converted to Prisma
-- SearchService.getTrendingSearches now uses Prisma $queryRawUnsafe to query materialized view directly (line 167), RPC no longer called.
--
-- Function signature: get_trending_searches(limit_count integer)
-- Related: SearchService.getTrendingSearches uses Prisma $queryRawUnsafe instead

DROP FUNCTION IF EXISTS public.get_trending_searches(integer);
