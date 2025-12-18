-- Migration: Remove unused get_search_count RPC (both overloads)
-- Version: 20251217000226
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_search_count RPC functions - Not found in codebase, only in generated types
-- Function signatures:
--   get_search_count(p_query text, p_categories content_category[] DEFAULT NULL::content_category[])
--   get_search_count(p_query text DEFAULT NULL::text, p_categories text[] DEFAULT NULL::text[], p_tags text[] DEFAULT NULL::text[], p_authors text[] DEFAULT NULL::text[])

DROP FUNCTION IF EXISTS public.get_search_count(text, public.content_category[]);
DROP FUNCTION IF EXISTS public.get_search_count(text, text[], text[], text[]);
