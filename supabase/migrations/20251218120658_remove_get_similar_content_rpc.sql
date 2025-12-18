-- Migration: Remove get_similar_content RPC function
-- Version: 20251218120658
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_similar_content RPC function - not found in codebase
--
-- This function returned similar content items based on content type and slug.
-- Function signature: get_similar_content(p_content_type content_category, p_content_slug text, p_limit integer DEFAULT 10)
-- Returns: similar_content_result composite type
--
-- Verification:
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
-- - Not found in apps/edge/ (no edge function usage)
--
-- Safe to remove: No codebase references found

DROP FUNCTION IF EXISTS public.get_similar_content(public.content_category, text, integer);
