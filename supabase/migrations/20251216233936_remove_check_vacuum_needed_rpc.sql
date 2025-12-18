-- Migration: Remove unused check_vacuum_needed RPC
-- Version: 20251216233936
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove check_vacuum_needed RPC function
-- This database maintenance function is unused in the codebase.

DROP FUNCTION IF EXISTS public.check_vacuum_needed();
