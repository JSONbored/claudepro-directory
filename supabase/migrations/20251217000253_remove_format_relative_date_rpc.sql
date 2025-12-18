-- Migration: Remove unused format_relative_date RPC
-- Version: 20251217000253
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove format_relative_date RPC function - Not found in codebase, codebase uses TypeScript formatRelativeDate
-- Note: format_date_long is KEEP (used by format_relative_date), but format_relative_date itself is unused
-- Function signature: format_relative_date(input_date timestamp with time zone, style text DEFAULT 'detailed'::text, max_days integer DEFAULT NULL::integer)

DROP FUNCTION IF EXISTS public.format_relative_date(timestamp with time zone, text, integer);
