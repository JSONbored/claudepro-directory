-- Migration: Remove unused get_user_interaction_summary RPC
-- Version: 20251217000223
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_user_interaction_summary RPC function - Not found in codebase, only in generated types
-- Function signature: get_user_interaction_summary(p_user_id uuid)

DROP FUNCTION IF EXISTS public.get_user_interaction_summary(uuid);
