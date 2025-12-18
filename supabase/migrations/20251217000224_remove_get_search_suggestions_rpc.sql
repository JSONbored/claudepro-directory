-- Migration: Remove unused get_search_suggestions RPC
-- Version: 20251217000224
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_search_suggestions RPC function - Only defined, codebase uses get_search_suggestions_formatted instead
-- Function signature: get_search_suggestions(p_query text, p_limit integer DEFAULT 10)

DROP FUNCTION IF EXISTS public.get_search_suggestions(text, integer);
