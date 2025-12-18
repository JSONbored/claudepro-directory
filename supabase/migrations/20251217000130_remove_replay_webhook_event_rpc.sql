-- Migration: Remove unused replay_webhook_event RPC
-- Version: 20251217000130
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove replay_webhook_event RPC function - No codebase usage found
-- Function signature: replay_webhook_event(p_webhook_event_id uuid)

DROP FUNCTION IF EXISTS public.replay_webhook_event(uuid);
