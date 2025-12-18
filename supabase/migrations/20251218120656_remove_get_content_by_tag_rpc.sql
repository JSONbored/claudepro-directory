-- Migration: Remove get_content_by_tag RPC function
-- Version: 20251218120656
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_content_by_tag RPC function - not found in codebase
--
-- This function returned content items that have a specific tag with pagination.
-- Function signature: get_content_by_tag(p_tag text, p_category content_category DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
--
-- Verification:
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/actions/ (no action calls)
-- - Not found in apps/web/src/app/ (no page usage)
-- - Not found in apps/edge/ (no edge function usage)
-- - Comment says "Used for /tags/[tag] pages" but no such pages found
--
-- Safe to remove: No codebase references found

DROP FUNCTION IF EXISTS public.get_content_by_tag(text, public.content_category, integer, integer);
