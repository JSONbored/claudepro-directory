-- Migration: Remove unused get_featured_jobs RPC
-- Version: 20251218120024
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_featured_jobs RPC function - Converted to Prisma
-- JobsService.getFeaturedJobs now uses Prisma directly (line 299), RPC no longer called.
--
-- Function signature: get_featured_jobs()
-- Related: JobsService.getFeaturedJobs uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_featured_jobs();
