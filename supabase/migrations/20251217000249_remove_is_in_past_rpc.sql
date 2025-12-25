-- Migration: Remove unused is_in_past RPC
-- Version: 20251217000249
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove is_in_past RPC function - Not found in codebase, codebase uses TypeScript date utilities
-- Function signature: is_in_past(input_date timestamp with time zone)
DROP FUNCTION IF EXISTS public.is_in_past (
  timestamp
  with
    time zone
);
