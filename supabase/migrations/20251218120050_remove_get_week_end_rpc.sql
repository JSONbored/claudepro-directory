-- Migration: Remove unused get_week_end RPC
-- Version: 20251218120050
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_week_end RPC function - No longer used
-- This RPC was only called by format_week_range RPC, which was removed in migration 20251217000254.
-- No other RPCs, triggers, or codebase calls this function.
--
-- Function signature: get_week_end(week_start timestamp with time zone)
-- Related: format_week_range RPC was removed (was the only caller)

DROP FUNCTION IF EXISTS public.get_week_end(timestamp with time zone);
