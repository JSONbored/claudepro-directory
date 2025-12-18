-- Migration: Optimize get_user_complete_data RPC
-- Date: 2025-12-11
-- Purpose: Reduce redundant queries in get_user_settings function
-- 
-- Analysis: get_user_settings queries the users table 3 times:
-- 1. EXISTS check for user
-- 2. SELECT username
-- 3. SELECT profile data (display_name, bio, etc.)
-- 4. SELECT user_data (slug, name, image, tier)
--
-- Optimization: Combine into single query to reduce database round-trips
-- Estimated savings: 66% reduction in queries for user settings (3 queries → 1 query)

-- Step 1: Create optimized version of get_user_settings
CREATE OR REPLACE FUNCTION public.get_user_settings(p_user_id uuid) 
RETURNS public.user_settings_result_v2
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_profile public.user_settings_profile;
  v_user_data public.user_settings_user_data;
  v_username text;
  v_result public.user_settings_result_v2;
  v_user_record RECORD;
BEGIN
  -- Explicitly set search_path in function body
  PERFORM set_config('search_path', '', true);
  
  -- OPTIMIZED: Single query to get all user data instead of 3-4 separate queries
  -- This reduces database round-trips from 3-4 to 1
  SELECT 
    u.username,
    u.display_name,
    u.bio,
    u.work,
    u.website,
    u.social_x_link,
    u.interests,
    u.profile_public,
    u.follow_email,
    u.created_at,
    u.slug,
    u.name,
    u.image,
    u.tier
  INTO v_user_record
  FROM public.users u
  WHERE u.id = p_user_id;
  
  -- Check if user exists (if no row found, v_user_record will be NULL)
  IF v_user_record.username IS NULL THEN
    RETURN NULL;
  END IF;

  -- Extract username
  v_username := v_user_record.username;

  -- Build profile settings as composite type (from single query result)
  v_profile := ROW(
    v_user_record.display_name,
    v_user_record.bio,
    v_user_record.work,
    v_user_record.website,
    v_user_record.social_x_link,
    v_user_record.interests,
    v_user_record.profile_public,
    v_user_record.follow_email,
    v_user_record.created_at
  )::public.user_settings_profile;

  -- Build user data as composite type (from single query result)
  v_user_data := ROW(
    v_user_record.slug,
    v_user_record.name,
    v_user_record.image,
    v_user_record.tier
  )::public.user_settings_user_data;

  -- Build result as composite type
  v_result := ROW(
    v_profile,
    v_user_data,
    v_username
  )::public.user_settings_result_v2;

  RETURN v_result;
END;
$$;

-- Update comment to reflect optimization
COMMENT ON FUNCTION public.get_user_settings(uuid) IS 'Get user settings including username (v2). 
Optimized: Queries users table once instead of 3-4 times, reducing database load by 66-75%.
Returns user_settings_result_v2 composite type containing profile, user_data, and username.';

-- Note: Further optimization opportunities:
-- 1. get_user_complete_data calls 8 functions sequentially
-- 2. Some functions query the same tables (e.g., multiple functions query users table)
-- 3. Future optimization: Use CTEs or LATERAL joins to combine queries within get_user_complete_data
-- 4. However, this requires significant refactoring of composite types and may break existing code
-- 5. Current optimization (single query in get_user_settings) provides immediate benefit with minimal risk
