-- Migration: Remove unused approve_submission RPC
-- Version: 20251216233928
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove approve_submission RPC function
-- This RPC function is unused in the codebase. No admin panel or codebase calls found.
-- Function signature: approve_submission(uuid, text)

DROP FUNCTION IF EXISTS public.approve_submission(uuid, text);
