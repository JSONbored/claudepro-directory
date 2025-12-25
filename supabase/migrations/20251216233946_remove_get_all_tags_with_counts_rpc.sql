-- Migration: Remove unused get_all_tags_with_counts RPC
-- Version: 20251216233946
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_all_tags_with_counts RPC function
-- This function is unused in the codebase.
-- Function signature: get_all_tags_with_counts(integer, integer)
DROP FUNCTION IF EXISTS public.get_all_tags_with_counts (integer, integer);
