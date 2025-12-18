-- Migration: Remove unused search_by_popularity RPC
-- Version: 20251217000202
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove search_by_popularity RPC function - Not found in codebase, only in generated types
-- Function signature: search_by_popularity(p_query text DEFAULT ''::text, p_categories content_category[] DEFAULT NULL::content_category[], p_tags text[] DEFAULT NULL::text[], p_authors text[] DEFAULT NULL::text[], p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)

DROP FUNCTION IF EXISTS public.search_by_popularity(text, public.content_category[], text[], text[], integer, integer);
