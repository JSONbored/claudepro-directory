-- Migration: Remove unused get_pending_resend_syncs RPC
-- Version: 20251217000148
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_pending_resend_syncs RPC function - Not found in Inngest functions, only in generated types
-- Function signature: get_pending_resend_syncs(p_limit integer DEFAULT 100)
DROP FUNCTION IF EXISTS public.get_pending_resend_syncs (integer);
