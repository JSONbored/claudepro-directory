-- =====================================================
-- Reputation System - Database Functions and Triggers
-- Run this in Supabase SQL Editor
-- =====================================================

-- Function to calculate reputation for a user
-- Formula:
-- - Post created: +10 points
-- - Vote received on post: +5 points
-- - Comment created: +2 points
-- - Submission merged: +20 points
CREATE OR REPLACE FUNCTION public.calculate_user_reputation(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_points INTEGER := 0;
  vote_points INTEGER := 0;
  comment_points INTEGER := 0;
  submission_points INTEGER := 0;
  total_reputation INTEGER := 0;
BEGIN
  -- Points from posts created (10 points each)
  SELECT COALESCE(COUNT(*) * 10, 0) INTO post_points
  FROM public.posts
  WHERE user_id = target_user_id;
  
  -- Points from votes received on posts (5 points each)
  SELECT COALESCE(SUM(p.vote_count) * 5, 0) INTO vote_points
  FROM public.posts p
  WHERE p.user_id = target_user_id;
  
  -- Points from comments created (2 points each)
  SELECT COALESCE(COUNT(*) * 2, 0) INTO comment_points
  FROM public.comments
  WHERE user_id = target_user_id;
  
  -- Points from merged submissions (20 points each)
  SELECT COALESCE(COUNT(*) * 20, 0) INTO submission_points
  FROM public.submissions
  WHERE user_id = target_user_id
    AND status = 'merged';
  
  -- Calculate total
  total_reputation := post_points + vote_points + comment_points + submission_points;
  
  -- Update user's reputation score
  UPDATE public.users
  SET reputation_score = total_reputation,
      updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN total_reputation;
END;
$function$;

-- Grant execute to authenticated users (for manual recalculation)
GRANT EXECUTE ON FUNCTION public.calculate_user_reputation(UUID) TO authenticated;

-- Function to update reputation after post is created
CREATE OR REPLACE FUNCTION public.update_reputation_on_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Async reputation update (don't block the post creation)
  PERFORM public.calculate_user_reputation(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- Function to update reputation when vote count changes
-- This runs after the vote_count is already updated by update_post_vote_count
CREATE OR REPLACE FUNCTION public.update_reputation_on_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  -- Update post owner's reputation
  IF post_owner_id IS NOT NULL THEN
    PERFORM public.calculate_user_reputation(post_owner_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Function to update reputation after comment is created
CREATE OR REPLACE FUNCTION public.update_reputation_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.calculate_user_reputation(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- Function to update reputation when submission status changes
CREATE OR REPLACE FUNCTION public.update_reputation_on_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only recalculate if status changed to/from 'merged'
  IF (TG_OP = 'INSERT' AND NEW.status = 'merged') OR
     (TG_OP = 'UPDATE' AND (OLD.status != NEW.status) AND 
      (OLD.status = 'merged' OR NEW.status = 'merged')) THEN
    PERFORM public.calculate_user_reputation(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Create triggers for automatic reputation updates
-- =====================================================

-- Trigger on posts (after insert)
DROP TRIGGER IF EXISTS trigger_reputation_on_post ON public.posts;
CREATE TRIGGER trigger_reputation_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_post();

-- Trigger on votes (after insert/delete)
-- Runs AFTER the vote_count is updated by existing update_post_vote_count trigger
DROP TRIGGER IF EXISTS trigger_reputation_on_vote_insert ON public.votes;
CREATE TRIGGER trigger_reputation_on_vote_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_vote();

DROP TRIGGER IF EXISTS trigger_reputation_on_vote_delete ON public.votes;
CREATE TRIGGER trigger_reputation_on_vote_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_vote();

-- Trigger on comments (after insert)
DROP TRIGGER IF EXISTS trigger_reputation_on_comment ON public.comments;
CREATE TRIGGER trigger_reputation_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_comment();

-- Trigger on submissions (after insert/update)
DROP TRIGGER IF EXISTS trigger_reputation_on_submission ON public.submissions;
CREATE TRIGGER trigger_reputation_on_submission
  AFTER INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_submission();

-- =====================================================
-- Backfill reputation for existing users
-- =====================================================

-- Recalculate reputation for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM public.users LOOP
    PERFORM public.calculate_user_reputation(user_record.id);
  END LOOP;
END $$;

-- =====================================================
-- Verification
-- =====================================================

-- Check that triggers were created
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_reputation%'
ORDER BY event_object_table, trigger_name;

-- Check reputation scores
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN reputation_score > 0 THEN 1 END) as users_with_reputation,
  MAX(reputation_score) as highest_reputation,
  AVG(reputation_score)::INTEGER as avg_reputation
FROM public.users;
