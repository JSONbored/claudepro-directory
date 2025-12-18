-- Migration: Remove unused get_current_week_start RPC
-- Version: 20251217000244
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_current_week_start RPC function - Not found in codebase, codebase uses TypeScript date utilities
-- Function signature: get_current_week_start()

DROP FUNCTION IF EXISTS public.get_current_week_start();
