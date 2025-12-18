-- Migration: Remove unused get_user_settings RPC
-- Version: 20251218120006
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_user_settings RPC function - Converted to Prisma
-- AccountService.getUserSettings now uses Prisma directly (line 500), RPC no longer called.
--
-- Function signature: get_user_settings(p_user_id uuid)
-- Related: AccountService.getUserSettings uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_user_settings(uuid);
