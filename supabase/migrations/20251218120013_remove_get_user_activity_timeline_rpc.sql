-- Migration: Remove unused get_user_activity_timeline RPC
-- Version: 20251218120013
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_user_activity_timeline RPC function - Converted to Prisma
-- AccountService.getUserActivityTimeline now uses Prisma directly (line 1276), RPC no longer called.
--
-- Function signature: get_user_activity_timeline(p_user_id uuid, p_type text, p_limit integer, p_offset integer)
-- Related: AccountService.getUserActivityTimeline uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_user_activity_timeline(uuid, text, integer, integer);
