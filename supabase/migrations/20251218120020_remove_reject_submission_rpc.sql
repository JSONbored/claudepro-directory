-- Migration: Remove unused reject_submission RPC
-- Version: 20251218120020
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove reject_submission RPC function - Not used in codebase
-- No action or codebase calls found for reject_submission. approve_submission was already removed.
-- UI only displays "rejected" status but doesn't call this RPC. Admin interface may not be implemented yet.
--
-- Function signature: reject_submission(p_submission_id uuid, p_moderator_notes text)
-- Related: approve_submission was already removed in migration 20251216233928

DROP FUNCTION IF EXISTS public.reject_submission(uuid, text);
