-- Migration: Remove get_webhook_event_by_svix_id RPC function
-- Version: 20251216054126
-- Applied via: Supabase MCP
-- Date: 2025-12-16
--
-- Description: Remove get_webhook_event_by_svix_id RPC function - converted to Prisma direct query
--
-- This function was a simple SELECT id FROM webhook_events WHERE svix_id = ? AND source = ?
-- The service now uses Prisma directly in MiscService.getWebhookEventBySvixId():
--   prisma.webhook_events.findFirst({ where: {...}, select: { id: true } })
--
-- Related Changes:
-- - packages/data-layer/src/services/misc.ts: Converted getWebhookEventBySvixId() to use Prisma
-- - packages/web-runtime/src/flux/handlers/webhook.ts: Updated to handle new return type

DROP FUNCTION IF EXISTS public.get_webhook_event_by_svix_id(text, public.webhook_source);
