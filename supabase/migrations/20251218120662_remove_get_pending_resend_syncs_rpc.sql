-- Migration: Remove get_pending_resend_syncs RPC function
-- Version: 20251218120662
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_pending_resend_syncs RPC function - not found in codebase
--
-- This function returned pending Resend sync operations.
-- Function signature: get_pending_resend_syncs(p_limit integer DEFAULT 100)
-- Returns: TABLE with id, content_type, content_slug, sync_type, scheduled_for, retry_count, last_error, created_at
--
-- Verification:
-- - Not found in packages/data-layer/src/services/ (no service method calls)
-- - Not found in packages/web-runtime/src/data/ (no data fetching calls)
-- - Not found in packages/web-runtime/src/inngest/ (no Inngest function usage)
-- - Not found in apps/edge/ (no edge function usage)
--
-- Safe to remove: No codebase references found

DROP FUNCTION IF EXISTS public.get_pending_resend_syncs(integer);
