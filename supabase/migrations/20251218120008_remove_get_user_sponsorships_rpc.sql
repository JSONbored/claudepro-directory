-- Migration: Remove unused get_user_sponsorships RPC
-- Version: 20251218120008
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_user_sponsorships RPC function - Converted to Prisma
-- AccountService.getUserSponsorships now uses Prisma directly (line 855), RPC no longer called.
--
-- Function signature: get_user_sponsorships(p_user_id uuid)
-- Related: AccountService.getUserSponsorships uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_user_sponsorships(uuid);
