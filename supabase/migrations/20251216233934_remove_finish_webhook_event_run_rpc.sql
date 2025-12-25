-- Migration: Remove unused finish_webhook_event_run RPC
-- Version: 20251216233934
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove finish_webhook_event_run RPC function
-- Webhook handlers now use Inngest functions instead of this RPC.
-- Function signature: finish_webhook_event_run(uuid, webhook_delivery_status, text, jsonb)
DROP FUNCTION IF EXISTS public.finish_webhook_event_run (uuid, webhook_delivery_status, text, jsonb);
