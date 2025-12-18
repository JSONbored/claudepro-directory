-- Migration: Remove get_all_app_settings RPC function
-- Version: 20251218120665
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_all_app_settings RPC function - not found in codebase
--
-- This function returned all app settings.
-- Function signature: get_all_app_settings()
--
-- Verification:
-- - Not found in packages/data-layer/src/services/ (no service method calls)
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
--
-- Safe to remove: No codebase references found

DROP FUNCTION IF EXISTS public.get_all_app_settings();
