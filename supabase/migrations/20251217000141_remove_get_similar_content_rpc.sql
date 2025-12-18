-- Migration: Remove unused get_similar_content RPC
-- Version: 20251217000141
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_similar_content RPC function - Embedding system removed, similar content uses content_similarities table directly
-- Function signature: get_similar_content(p_content_type content_category, p_content_slug text, p_limit integer DEFAULT 10)

DROP FUNCTION IF EXISTS public.get_similar_content(public.content_category, text, integer);
