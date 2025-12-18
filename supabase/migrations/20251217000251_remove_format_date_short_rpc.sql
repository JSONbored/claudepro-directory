-- Migration: Remove unused format_date_short RPC
-- Version: 20251217000251
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove format_date_short RPC function - Not found in codebase, codebase uses TypeScript formatDate
-- Function signature: format_date_short(input_date timestamp with time zone)

DROP FUNCTION IF EXISTS public.format_date_short(timestamp with time zone);
