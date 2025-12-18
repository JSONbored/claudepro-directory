-- Migration: Remove unused audit_job_subscription_state RPC
-- Version: 20251216233929
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove audit_job_subscription_state RPC function
-- This RPC function is unused in the codebase. No calls found.

DROP FUNCTION IF EXISTS public.audit_job_subscription_state();
