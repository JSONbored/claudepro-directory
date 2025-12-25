-- Migration: Remove unused get_active_sponsored_content RPC
-- Version: 20251216233942
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_active_sponsored_content RPC function
-- This function is unused in the codebase.
-- Function signature: get_active_sponsored_content(content_category, integer)
DROP FUNCTION IF EXISTS public.get_active_sponsored_content (content_category, integer);
