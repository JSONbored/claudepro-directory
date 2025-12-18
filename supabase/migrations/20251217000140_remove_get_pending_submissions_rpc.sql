-- Migration: Remove unused get_pending_submissions RPC
-- Version: 20251217000140
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_pending_submissions RPC function - Only exists in generated types, no codebase calls
-- Function signature: get_pending_submissions(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_filter_type text DEFAULT NULL::text)

DROP FUNCTION IF EXISTS public.get_pending_submissions(integer, integer, text);
