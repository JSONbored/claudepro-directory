-- Migration: Remove get_generation_config RPC function
-- Version: 20251218120673
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_generation_config RPC function - not found in codebase
--
-- This function returned generation configuration.
-- Function signature: get_generation_config(...)
--
-- Verification:
-- - Not found in packages/data-layer/src/services/ (no service method calls)
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
--
-- Safe to remove: No codebase references found

DROP FUNCTION IF EXISTS public.get_generation_config(public.content_category);
