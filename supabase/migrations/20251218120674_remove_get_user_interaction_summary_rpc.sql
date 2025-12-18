-- Migration: Remove get_user_interaction_summary RPC function
-- Version: 20251218120674
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_user_interaction_summary RPC function - not found in codebase
--
-- This function returned user interaction summary.
-- Function signature: get_user_interaction_summary(...)
--
-- Verification:
-- - Not found in packages/data-layer/src/services/ (no service method calls)
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
--
-- Safe to remove: No codebase references found

DROP FUNCTION IF EXISTS public.get_user_interaction_summary(uuid);
