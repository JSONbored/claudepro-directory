-- Migration: Remove unused build_job_discord_embed RPC
-- Version: 20251217000232
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove build_job_discord_embed RPC function - Only defined, not called by triggers or codebase
-- Function signature: build_job_discord_embed(p_job_id uuid)

DROP FUNCTION IF EXISTS public.build_job_discord_embed(uuid);
