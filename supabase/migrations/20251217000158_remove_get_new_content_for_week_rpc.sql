-- Migration: Remove unused get_new_content_for_week RPC
-- Version: 20251217000158
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_new_content_for_week RPC function - Not found in codebase, only in generated types
-- Function signature: get_new_content_for_week(p_week_start date, p_limit integer DEFAULT 5)

DROP FUNCTION IF EXISTS public.get_new_content_for_week(date, integer);
