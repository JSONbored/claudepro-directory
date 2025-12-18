-- Migration: Remove unused refresh_trending_metrics_view RPC
-- Version: 20251217000230
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove refresh_trending_metrics_view RPC function - Not found in codebase, only in generated types
-- Function signature: refresh_trending_metrics_view()

DROP FUNCTION IF EXISTS public.refresh_trending_metrics_view();
