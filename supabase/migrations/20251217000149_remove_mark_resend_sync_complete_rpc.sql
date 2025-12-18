-- Migration: Remove unused mark_resend_sync_complete RPC
-- Version: 20251217000149
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove mark_resend_sync_complete RPC function - Not found in Inngest functions, only in generated types
-- Function signature: mark_resend_sync_complete(p_subscription_id uuid, p_resend_contact_id text, p_success boolean DEFAULT true, p_error_message text DEFAULT NULL::text)

DROP FUNCTION IF EXISTS public.mark_resend_sync_complete(uuid, text, boolean, text);
