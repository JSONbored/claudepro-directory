-- Migration: Remove unused search_users RPC
-- Version: 20251217000206
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove search_users RPC function - Not found in codebase, only in generated types
-- Function signature: search_users(search_query text, result_limit integer DEFAULT 20)
DROP FUNCTION IF EXISTS public.search_users (text, integer);
