-- Migration: Remove unused upsert_content_by_slug RPC
-- Version: 20251216233957
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove upsert_content_by_slug RPC function
-- This function is unused in the codebase.
-- Function signature: upsert_content_by_slug(text, content_category, text, text, jsonb, text[], text)

DROP FUNCTION IF EXISTS public.upsert_content_by_slug(text, content_category, text, text, jsonb, text[], text);
