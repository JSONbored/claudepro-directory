-- Migration: Remove get_days_ago RPC function
-- Version: 20251218120672
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_days_ago RPC function - not found in codebase
--
-- This function calculated days ago from a timestamp.
-- Function signature: get_days_ago(input_date timestamp with time zone)
-- Returns: integer
--
-- Verification:
-- - Not found in packages/data-layer/src/services/ (no service method calls)
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
--
-- Note: Date calculations are likely done in TypeScript/application layer
--
-- Safe to remove: No codebase references found
DROP FUNCTION IF EXISTS public.get_days_ago (
  timestamp
  with
    time zone
);
