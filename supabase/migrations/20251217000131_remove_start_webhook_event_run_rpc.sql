-- Migration: Remove unused start_webhook_event_run RPC
-- Version: 20251217000131
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove start_webhook_event_run RPC function - No codebase usage found
-- Function signature: start_webhook_event_run(p_webhook_event_id uuid)
DROP FUNCTION IF EXISTS public.start_webhook_event_run (uuid);
