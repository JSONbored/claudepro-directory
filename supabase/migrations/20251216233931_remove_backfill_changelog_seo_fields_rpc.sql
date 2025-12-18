-- Migration: Remove unused backfill_changelog_seo_fields RPC
-- Version: 20251216233931
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove backfill_changelog_seo_fields RPC function
-- This was a one-time backfill utility that is no longer needed.

DROP FUNCTION IF EXISTS public.backfill_changelog_seo_fields();
