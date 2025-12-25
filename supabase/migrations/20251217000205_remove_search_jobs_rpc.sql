-- Migration: Remove unused search_jobs RPC
-- Version: 20251217000205
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove search_jobs RPC function - Not found in codebase, only in generated types
-- Function signature: search_jobs(search_query text, result_limit integer DEFAULT 20)
DROP FUNCTION IF EXISTS public.search_jobs (text, integer);
