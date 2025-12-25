-- Migration: Remove unused get_active_announcement RPC
-- Version: 20251216233939
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_active_announcement RPC function
-- Migrated to Prisma: MiscService.getActiveAnnouncement()
-- Function signature: get_active_announcement(timestamp with time zone)
DROP FUNCTION IF EXISTS public.get_active_announcement (
  timestamp
  with
    time zone
);
