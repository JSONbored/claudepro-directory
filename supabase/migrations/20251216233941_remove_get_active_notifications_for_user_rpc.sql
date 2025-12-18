-- Migration: Remove unused get_active_notifications_for_user RPC
-- Version: 20251216233941
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_active_notifications_for_user RPC function
-- Migrated to Prisma: MiscService.getActiveNotifications()
-- Function signature: get_active_notifications_for_user(uuid)

DROP FUNCTION IF EXISTS public.get_active_notifications_for_user(uuid);
