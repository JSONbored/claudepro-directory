-- Migration: Remove unused handle_webhook_email_sent RPC
-- Version: 20251217000127
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove handle_webhook_email_sent RPC function - Resend webhook handler uses Inngest, not RPCs
-- Function signature: handle_webhook_email_sent(p_webhook_id uuid, p_event_data jsonb)

DROP FUNCTION IF EXISTS public.handle_webhook_email_sent(uuid, jsonb);
