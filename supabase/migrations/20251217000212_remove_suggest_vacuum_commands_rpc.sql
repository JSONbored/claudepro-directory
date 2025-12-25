-- Migration: Remove unused suggest_vacuum_commands RPC
-- Version: 20251217000212
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove suggest_vacuum_commands RPC function - Not found in codebase, only in generated types
-- Function signature: suggest_vacuum_commands(p_min_bloat_ratio numeric DEFAULT 30.0)
DROP FUNCTION IF EXISTS public.suggest_vacuum_commands (numeric);
