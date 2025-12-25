-- Migration: Remove unused get_user_content_vote RPC
-- Version: 20251217000142
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_user_content_vote RPC function - Only exists in generated types, no codebase calls
-- Function signature: get_user_content_vote(p_content_slug text, p_content_type content_category, p_user_id uuid DEFAULT NULL::uuid, p_session_id text DEFAULT NULL::text)
DROP FUNCTION IF EXISTS public.get_user_content_vote (text, public.content_category, uuid, text);
