-- Migration: Remove unused calculate_content_time_metrics RPC
-- Version: 20251217000229
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove calculate_content_time_metrics RPC function - Not found in codebase, only in generated types
-- Function signature: calculate_content_time_metrics()
DROP FUNCTION IF EXISTS public.calculate_content_time_metrics ();
