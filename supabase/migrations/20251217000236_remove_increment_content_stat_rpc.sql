-- Migration: Remove unused increment_content_stat RPC
-- Version: 20251217000236
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove increment_content_stat RPC function - Only defined, not called by triggers or codebase
-- Function signature: increment_content_stat(p_category content_category, p_slug text, p_stat_name text)

DROP FUNCTION IF EXISTS public.increment_content_stat(public.content_category, text, text);
