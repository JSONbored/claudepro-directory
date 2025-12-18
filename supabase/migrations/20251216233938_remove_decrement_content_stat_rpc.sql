-- Migration: Remove unused decrement_content_stat RPC
-- Version: 20251216233938
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove decrement_content_stat RPC function
-- This function is unused. Only increment_content_stat is used (via triggers).
-- Function signature: decrement_content_stat(content_category, text, text)

DROP FUNCTION IF EXISTS public.decrement_content_stat(content_category, text, text);
