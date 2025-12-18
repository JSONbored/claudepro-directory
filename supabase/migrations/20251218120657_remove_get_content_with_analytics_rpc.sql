-- Migration: Remove get_content_with_analytics RPC functions (both overloads)
-- Version: 20251218120657
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_content_with_analytics RPC functions - not found in codebase
--
-- This function had two overloads:
-- 1. get_content_with_analytics(p_category content_category DEFAULT NULL, p_limit integer DEFAULT 100)
--    Returns TABLE with category, slug, title, description, date_added, view_count, copy_count, bookmark_count
-- 2. get_content_with_analytics(p_category content_category, p_slug text)
--    Returns TABLE with id, category, slug, title, description, view_count, copy_count, bookmark_count
--
-- Verification:
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
-- - Not found in apps/edge/ (no edge function usage)
--
-- Note: get_content_analytics (singular) is still used and should NOT be removed
--
-- Safe to remove: No codebase references found for either overload

DROP FUNCTION IF EXISTS public.get_content_with_analytics(public.content_category, integer);
DROP FUNCTION IF EXISTS public.get_content_with_analytics(public.content_category, text);
