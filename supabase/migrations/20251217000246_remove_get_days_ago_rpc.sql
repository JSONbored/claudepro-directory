-- Migration: Remove unused get_days_ago RPC
-- Version: 20251217000246
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_days_ago RPC function - Not found in codebase, codebase uses TypeScript date utilities
-- Function signature: get_days_ago(input_date timestamp with time zone)

DROP FUNCTION IF EXISTS public.get_days_ago(timestamp with time zone);
