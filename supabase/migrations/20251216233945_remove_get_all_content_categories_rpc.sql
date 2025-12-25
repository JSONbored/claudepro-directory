-- Migration: Remove unused get_all_content_categories RPC
-- Version: 20251216233945
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_all_content_categories RPC function
-- This function is unused in the codebase.
DROP FUNCTION IF EXISTS public.get_all_content_categories ();
