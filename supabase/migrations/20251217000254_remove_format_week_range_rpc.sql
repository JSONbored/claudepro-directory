-- Migration: Remove unused format_week_range RPC
-- Version: 20251217000254
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove format_week_range RPC function - Not found in codebase, codebase uses TypeScript date utilities
-- Note: get_week_end is KEEP (used by format_week_range), but format_week_range itself is unused
-- Function signature: format_week_range(week_start timestamp with time zone)
DROP FUNCTION IF EXISTS public.format_week_range (
  timestamp
  with
    time zone
);
