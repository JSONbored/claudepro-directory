-- Migration: Remove unused get_payment_plan_catalog RPC
-- Version: 20251218120028
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_payment_plan_catalog RPC function - Converted to Prisma
-- JobsService.getPaymentPlanCatalog now uses Prisma directly (line 474), RPC no longer called.
--
-- Function signature: get_payment_plan_catalog()
-- Related: JobsService.getPaymentPlanCatalog uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_payment_plan_catalog();
