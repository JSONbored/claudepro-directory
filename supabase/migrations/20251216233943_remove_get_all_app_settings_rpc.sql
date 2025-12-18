-- Migration: Remove unused get_all_app_settings RPC
-- Version: 20251216233943
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_all_app_settings RPC function
-- Codebase uses MiscService.getAppSetting() for individual settings instead.

DROP FUNCTION IF EXISTS public.get_all_app_settings();
