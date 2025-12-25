-- Migration: Remove unused verify_content_slug_unique RPC
-- Version: 20251217000235
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove verify_content_slug_unique RPC function - Only defined, not called
-- Function signature: verify_content_slug_unique(p_slug text, p_category content_category)
DROP FUNCTION IF EXISTS public.verify_content_slug_unique (text, public.content_category);
