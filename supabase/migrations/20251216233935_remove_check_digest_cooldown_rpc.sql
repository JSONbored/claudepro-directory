-- Migration: Remove unused check_digest_cooldown RPC
-- Version: 20251216233935
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove check_digest_cooldown RPC function
-- Digest email function now uses MiscService.getAppSetting() instead of this RPC.
DROP FUNCTION IF EXISTS public.check_digest_cooldown ();
