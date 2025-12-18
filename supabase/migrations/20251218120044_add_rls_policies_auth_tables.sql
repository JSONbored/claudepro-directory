-- Migration: Add RLS policies to auth-related tables
-- Version: 20251218120044
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Add Row Level Security (RLS) policies to three tables that currently lack them
-- These tables contain sensitive data and should be protected:
-- 1. job_runs - Contains job execution data
-- 2. mfa_failed_verification_attempts - Contains sensitive auth data
-- 3. password_failed_verification_attempts - Contains sensitive auth data
--
-- Security Strategy:
-- - These tables are primarily accessed by service_role (backend operations)
-- - Regular users (anon/authenticated) should NOT have access
-- - Policies restrict access to service_role only for security

-- Enable RLS on job_runs table
ALTER TABLE IF EXISTS public.job_runs ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can access job_runs
-- This table contains job execution data that should only be accessed by backend services
CREATE POLICY "service_role_only_job_runs"
  ON public.job_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny all access to anon and authenticated roles
CREATE POLICY "deny_anon_authenticated_job_runs"
  ON public.job_runs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Enable RLS on mfa_failed_verification_attempts table
ALTER TABLE IF EXISTS public.mfa_failed_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can access MFA verification attempts
-- This table contains sensitive authentication data
CREATE POLICY "service_role_only_mfa_attempts"
  ON public.mfa_failed_verification_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny all access to anon and authenticated roles
CREATE POLICY "deny_anon_authenticated_mfa_attempts"
  ON public.mfa_failed_verification_attempts
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Enable RLS on password_failed_verification_attempts table
ALTER TABLE IF EXISTS public.password_failed_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can access password verification attempts
-- This table contains sensitive authentication data
CREATE POLICY "service_role_only_password_attempts"
  ON public.password_failed_verification_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny all access to anon and authenticated roles
CREATE POLICY "deny_anon_authenticated_password_attempts"
  ON public.password_failed_verification_attempts
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
