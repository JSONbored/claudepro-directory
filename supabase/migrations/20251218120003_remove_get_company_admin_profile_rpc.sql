-- Migration: Remove unused get_company_admin_profile RPC
-- Version: 20251218120003
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_company_admin_profile RPC function - Converted to Prisma
-- CompaniesService.getCompanyAdminProfile now uses Prisma directly (line 49), RPC no longer called.
--
-- Function signature: get_company_admin_profile(p_company_id uuid)
-- Related: CompaniesService.getCompanyAdminProfile uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_company_admin_profile(uuid);
