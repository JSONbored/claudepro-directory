-- Fix Supabase Functions - Security and Performance Updates
-- Run this in Supabase SQL Editor (Database → SQL Editor → New Query)
-- =====================================================

-- Drop existing is_following function first (required due to parameter name change)
DROP FUNCTION IF EXISTS is_following(UUID, UUID);

-- Set search_path for all functions (prevents schema hijacking)

-- 1. generate_user_slug
CREATE OR REPLACE FUNCTION public.generate_user_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  RETURN NEW;
END;
$$;

-- 2. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. generate_slug_from_name
CREATE OR REPLACE FUNCTION public.generate_slug_from_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  IF NEW.slug = '' THEN
    NEW.slug := 'item-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. update_post_vote_count
CREATE OR REPLACE FUNCTION public.update_post_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET vote_count = (
    SELECT COUNT(*) FROM public.votes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. get_popular_posts
CREATE OR REPLACE FUNCTION public.get_popular_posts(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content_type TEXT,
  content_slug TEXT,
  title TEXT,
  body TEXT,
  vote_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.content_type, p.content_slug, p.title, p.body,
         p.vote_count, p.comment_count, p.created_at, p.updated_at
  FROM public.posts p
  ORDER BY p.vote_count DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 6. is_following (NEW - with corrected parameter names)
CREATE OR REPLACE FUNCTION public.is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.followers 
    WHERE followers.follower_id = is_following.follower_id 
    AND followers.following_id = is_following.following_id
  );
END;
$$;

-- Verification query (run this after executing the above to verify success)
-- SELECT routine_name, routine_type, security_type FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name IN (
--   'generate_user_slug', 'update_updated_at_column', 'generate_slug_from_name', 
--   'update_post_vote_count', 'get_popular_posts', 'is_following'
-- );
