-- Migration: Remove unused format_date_long RPC
-- Version: 20251218120051
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove format_date_long RPC function - No longer used
-- This RPC was only called by format_relative_date RPC, which was removed in migration 20251217000253.
-- No other RPCs, triggers, or codebase calls this function.
--
-- Function signature: format_date_long(input_date timestamp with time zone)
-- Related: format_relative_date RPC was removed (was the only caller)

DROP FUNCTION IF EXISTS public.format_date_long(timestamp with time zone);
