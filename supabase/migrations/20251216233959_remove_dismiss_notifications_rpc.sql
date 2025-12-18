-- Migration: Remove unused dismiss_notifications RPC
-- Version: 20251216233959
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove dismiss_notifications RPC function
-- Codebase uses Flux Station edge function for notification dismissal, not this RPC.
-- Function signatures: dismiss_notifications(uuid, uuid[]) and dismiss_notifications(uuid, text[])

DROP FUNCTION IF EXISTS public.dismiss_notifications(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.dismiss_notifications(uuid, text[]);
