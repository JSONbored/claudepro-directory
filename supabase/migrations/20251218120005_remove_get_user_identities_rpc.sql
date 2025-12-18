-- Migration: Remove unused get_user_identities RPC
-- Version: 20251218120005
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_user_identities RPC function - Converted to Prisma
-- AccountService.getUserIdentities now uses Prisma directly (line 1352), RPC no longer called.
--
-- Function signature: get_user_identities(p_user_id uuid)
-- Related: AccountService.getUserIdentities uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_user_identities(uuid);
