-- Migration: Remove unused toggle_content_vote RPC
-- Version: 20251216233956
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove toggle_content_vote RPC function
-- "I use this" voting feature is not implemented in the UI.
-- Function signature: toggle_content_vote(text, content_category, uuid, text)

DROP FUNCTION IF EXISTS public.toggle_content_vote(text, content_category, uuid, text);
