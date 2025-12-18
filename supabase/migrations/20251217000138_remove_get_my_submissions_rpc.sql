-- Migration: Remove unused get_my_submissions RPC
-- Version: 20251217000138
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_my_submissions RPC function - Only exists in generated types, no codebase calls
-- Function signature: get_my_submissions(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)

DROP FUNCTION IF EXISTS public.get_my_submissions(integer, integer);
