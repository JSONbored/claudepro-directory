-- Migration: Remove unused get_social_proof_stats RPC (with arguments)
-- Version: 20251218120046
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_social_proof_stats(p_week_ago, p_month_ago) RPC function - Converted to Prisma
-- MiscService.getSocialProofStats now uses Prisma directly (line 365), RPC no longer called.
-- Edge function also uses Prisma directly (apps/edge/supabase/functions/heyclaude-mcp/routes/social-proof.ts).
--
-- Function signature: get_social_proof_stats(p_week_ago timestamp with time zone, p_month_ago timestamp with time zone)
-- Related: MiscService.getSocialProofStats uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_social_proof_stats(timestamp with time zone, timestamp with time zone);
