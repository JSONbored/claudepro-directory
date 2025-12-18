-- Migration: Remove unused get_content_by_tag RPC
-- Version: 20251217000159
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_content_by_tag RPC function - Not found in codebase, only in generated types
-- Function signature: get_content_by_tag(p_tag text, p_category content_category DEFAULT NULL::content_category, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)

DROP FUNCTION IF EXISTS public.get_content_by_tag(text, public.content_category, integer, integer);
