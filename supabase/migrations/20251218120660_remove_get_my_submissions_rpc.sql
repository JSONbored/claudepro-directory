-- Migration: Remove get_my_submissions RPC function
-- Version: 20251218120660
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_my_submissions RPC function - not found in codebase
--
-- This function returned user's own submissions with pagination.
-- Function signature: get_my_submissions(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
-- Returns: SETOF my_submissions_item
--
-- Verification:
-- - Not found in packages/data-layer/src/services/ (no service method calls)
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
--
-- Safe to remove: No codebase references found

DROP FUNCTION IF EXISTS public.get_my_submissions(integer, integer);
