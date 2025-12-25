-- Migration: Remove unused get_bookmark_counts_by_category RPC
-- Version: 20251216233949
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_bookmark_counts_by_category RPC function
-- This function is unused in the codebase.
-- Function signature: get_bookmark_counts_by_category(content_category)
DROP FUNCTION IF EXISTS public.get_bookmark_counts_by_category (content_category);
