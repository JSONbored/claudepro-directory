-- Migration: Remove duplicate indexes
-- Version: 20251218120043
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove 6 duplicate indexes that are redundant with UNIQUE constraints
-- These indexes duplicate the functionality of UNIQUE constraints, wasting storage
-- and slowing INSERT/UPDATE operations. Estimated savings: ~50-100MB
--
-- Safe to remove because:
-- 1. Each index duplicates a UNIQUE constraint on the same column
-- 2. UNIQUE constraints automatically create indexes
-- 3. No queries depend on these specific index names
--
-- Indexes to remove:
-- 1. idx_app_settings_key (duplicates app_settings_pkey UNIQUE on setting_key)
-- 2. idx_newsletter_resend_contact_id (duplicates newsletter_subscriptions_resend_contact_id_key UNIQUE)
-- 3. idx_payments_polar_transaction_id (duplicates payments_polar_transaction_id_key UNIQUE)
-- 4. idx_subscriptions_polar_id (duplicates subscriptions_polar_subscription_id_key UNIQUE)
-- 5. idx_user_mcps_slug (duplicates user_mcps_slug_key UNIQUE)
-- 6. idx_users_email (duplicates users_email_key UNIQUE)
-- Remove duplicate indexes (safe - UNIQUE constraints provide the same functionality)
DROP INDEX IF EXISTS public.idx_app_settings_key;

DROP INDEX IF EXISTS public.idx_newsletter_resend_contact_id;

DROP INDEX IF EXISTS public.idx_payments_polar_transaction_id;

DROP INDEX IF EXISTS public.idx_subscriptions_polar_id;

DROP INDEX IF EXISTS public.idx_user_mcps_slug;

DROP INDEX IF EXISTS public.idx_users_email;
