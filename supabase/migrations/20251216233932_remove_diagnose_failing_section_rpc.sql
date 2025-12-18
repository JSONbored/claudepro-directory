-- Migration: Remove unused diagnose_failing_section RPC
-- Version: 20251216233932
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove diagnose_failing_section RPC function
-- This was a debug utility that is no longer used.
-- Function signature: diagnose_failing_section(text, integer)

DROP FUNCTION IF EXISTS public.diagnose_failing_section(text, integer);
