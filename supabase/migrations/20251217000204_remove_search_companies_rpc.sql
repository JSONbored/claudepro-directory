-- Migration: Remove unused search_companies RPC
-- Version: 20251217000204
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove search_companies RPC function - Not found in codebase, only in generated types
-- Function signature: search_companies(search_query text, result_limit integer DEFAULT 20)
DROP FUNCTION IF EXISTS public.search_companies (text, integer);
