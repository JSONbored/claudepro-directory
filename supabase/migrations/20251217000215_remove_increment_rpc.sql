-- Migration: Remove unused increment RPC
-- Version: 20251217000215
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove increment RPC function - Only defined, not called in migration file
-- Function signature: increment(table_name text, row_id uuid, column_name text, increment_by integer DEFAULT 1)

DROP FUNCTION IF EXISTS public.increment(text, uuid, text, integer);
