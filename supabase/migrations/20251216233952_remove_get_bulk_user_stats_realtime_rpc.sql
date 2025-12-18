-- Migration: Remove unused get_bulk_user_stats_realtime RPC
-- Version: 20251216233952
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_bulk_user_stats_realtime RPC function
-- This function is unused in the codebase.
-- Function signature: get_bulk_user_stats_realtime(uuid[])

DROP FUNCTION IF EXISTS public.get_bulk_user_stats_realtime(uuid[]);
