-- Migration: Remove unused get_content_with_analytics RPC (both overloads)
-- Version: 20251217000201
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_content_with_analytics RPC functions - Not found in codebase, only in generated types
-- Function signatures: 
--   get_content_with_analytics(p_category content_category DEFAULT NULL::content_category, p_limit integer DEFAULT 100)
--   get_content_with_analytics(p_category content_category, p_slug text)
DROP FUNCTION IF EXISTS public.get_content_with_analytics (public.content_category, integer);

DROP FUNCTION IF EXISTS public.get_content_with_analytics (public.content_category, text);
