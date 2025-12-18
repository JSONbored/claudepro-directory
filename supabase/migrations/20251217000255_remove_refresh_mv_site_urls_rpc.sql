-- Migration: Remove unused refresh_mv_site_urls RPC
-- Version: 20251217000255
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove refresh_mv_site_urls RPC function - Only defined, pg_cron job 26 refreshes MV directly (doesn't call this function)
-- Function signature: refresh_mv_site_urls()

DROP FUNCTION IF EXISTS public.refresh_mv_site_urls();
