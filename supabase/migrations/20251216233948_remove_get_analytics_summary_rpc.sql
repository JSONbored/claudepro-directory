-- Migration: Remove unused get_analytics_summary RPC
-- Version: 20251216233948
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_analytics_summary RPC function
-- This function is unused in the codebase.
-- Function signature: get_analytics_summary(content_category)
DROP FUNCTION IF EXISTS public.get_analytics_summary (content_category);
