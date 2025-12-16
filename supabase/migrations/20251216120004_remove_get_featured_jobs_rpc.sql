-- Migration: Remove get_featured_jobs RPC function
-- Version: 20251216120004
-- Applied via: Supabase MCP
-- Date: 2025-12-16
--
-- Description: Remove get_featured_jobs RPC function - converted to Prisma direct query
--
-- This function had complex UNION ALL logic with placeholders, but we replicate it with Prisma.
-- The service now uses Prisma directly in JobsService.getFeaturedJobs():
--   - Count real featured jobs
--   - Fetch real featured jobs (up to 6)
--   - Fetch placeholder jobs if needed
--   - Combine and sort in JavaScript
--
-- Related Changes:
-- - packages/data-layer/src/services/jobs.ts: Converted getFeaturedJobs() to use Prisma
-- - packages/web-runtime/src/data/jobs.ts: Updated to use Prisma model types

DROP FUNCTION IF EXISTS public.get_featured_jobs();
