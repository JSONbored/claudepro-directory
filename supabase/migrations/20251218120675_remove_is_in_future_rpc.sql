-- Migration: Remove is_in_future RPC function
-- Version: 20251218120675
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove is_in_future RPC function - not found in codebase
--
-- This function checked if a timestamp is in the future.
-- Function signature: is_in_future(input_date timestamp with time zone)
-- Returns: boolean
--
-- Verification:
-- - Not found in packages/data-layer/src/services/ (no service method calls)
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
--
-- Note: Date comparisons are likely done in TypeScript/application layer
--
-- Safe to remove: No codebase references found
DROP FUNCTION IF EXISTS public.is_in_future (
  timestamp
  with
    time zone
);
