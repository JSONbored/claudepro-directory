-- Migration: Remove unused get_database_fingerprint RPC
-- Version: 20251217000209
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_database_fingerprint RPC function - Not found in codebase, only in generated types
-- Function signature: get_database_fingerprint()

DROP FUNCTION IF EXISTS public.get_database_fingerprint();
