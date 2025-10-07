-- =====================================================
-- Badge Awarding System - Automatic Achievement Tracking
-- Run this in Supabase SQL Editor AFTER reputation system
-- =====================================================

-- Function to check and award a specific badge
CREATE OR REPLACE FUNCTION public.check_and_award_badge(
  target_user_id UUID,
  badge_slug TEXT
)
RETURNS BOOLEAN -- Returns true if badge was awarded, false if already had it or doesn't qualify
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  badge_record RECORD;
  user_qualifies BOOLEAN := false;
  post_count INTEGER;
  max_post_votes INTEGER;
  merged_count INTEGER;
  user_reputation INTEGER;
BEGIN
  -- Get badge details
  SELECT * INTO badge_record
  FROM public.badges
  WHERE slug = badge_slug AND active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user already has this badge
  IF EXISTS (
    SELECT 1 FROM public.user_badges 
    WHERE user_id = target_user_id AND badge_id = badge_record.id
  ) THEN
    RETURN false; -- Already has badge
  END IF;
  
  -- Check criteria based on badge type
  -- Extract criteria type from JSONB
  CASE badge_record.criteria->>'type'
    WHEN 'post_count' THEN
      -- Count user's posts
      SELECT COUNT(*) INTO post_count
      FROM public.posts
      WHERE user_id = target_user_id;
      
      user_qualifies := post_count >= (badge_record.criteria->>'threshold')::INTEGER;
    
    WHEN 'post_votes' THEN
      -- Check if any post has enough votes
      SELECT MAX(vote_count) INTO max_post_votes
      FROM public.posts
      WHERE user_id = target_user_id;
      
      user_qualifies := COALESCE(max_post_votes, 0) >= (badge_record.criteria->>'threshold')::INTEGER;
    
    WHEN 'submission_merged' THEN
      -- Count merged submissions
      SELECT COUNT(*) INTO merged_count
      FROM public.submissions
      WHERE user_id = target_user_id AND status = 'merged';
      
      user_qualifies := merged_count >= (badge_record.criteria->>'threshold')::INTEGER;
    
    WHEN 'reputation' THEN
      -- Check reputation score
      SELECT reputation_score INTO user_reputation
      FROM public.users
      WHERE id = target_user_id;
      
      user_qualifies := COALESCE(user_reputation, 0) >= (badge_record.criteria->>'threshold')::INTEGER;
    
    WHEN 'manual' THEN
      -- Manual badges require admin action, skip automatic check
      user_qualifies := false;
    
    ELSE
      user_qualifies := false;
  END CASE;
  
  -- Award badge if qualified
  IF user_qualifies THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (target_user_id, badge_record.id, NOW())
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_and_award_badge(UUID, TEXT) TO authenticated;

-- Function to check all badge criteria for a user
-- Called after reputation updates
CREATE OR REPLACE FUNCTION public.check_all_badges(target_user_id UUID)
RETURNS INTEGER -- Returns count of newly awarded badges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  badge_record RECORD;
  newly_awarded INTEGER := 0;
  was_awarded BOOLEAN;
BEGIN
  -- Loop through all active badges and check criteria
  FOR badge_record IN 
    SELECT slug FROM public.badges WHERE active = true ORDER BY "order"
  LOOP
    SELECT public.check_and_award_badge(target_user_id, badge_record.slug) 
    INTO was_awarded;
    
    IF was_awarded THEN
      newly_awarded := newly_awarded + 1;
    END IF;
  END LOOP;
  
  RETURN newly_awarded;
END;
$function$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_all_badges(UUID) TO authenticated;

-- Function to check badges after reputation update
-- This is called by the reputation triggers
CREATE OR REPLACE FUNCTION public.check_badges_after_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check all badges for the user whose reputation changed
  -- Run asynchronously (don't block the operation)
  PERFORM public.check_all_badges(NEW.id);
  RETURN NEW;
END;
$function$;

-- Trigger to check badges when reputation changes
DROP TRIGGER IF EXISTS trigger_check_badges_on_reputation ON public.users;
CREATE TRIGGER trigger_check_badges_on_reputation
  AFTER UPDATE OF reputation_score ON public.users
  FOR EACH ROW
  WHEN (OLD.reputation_score IS DISTINCT FROM NEW.reputation_score)
  EXECUTE FUNCTION public.check_badges_after_reputation();

-- =====================================================
-- Backfill badges for existing users
-- =====================================================

-- Check and award badges for all existing users
DO $$
DECLARE
  user_record RECORD;
  badges_awarded INTEGER;
BEGIN
  FOR user_record IN SELECT id FROM public.users LOOP
    SELECT public.check_all_badges(user_record.id) INTO badges_awarded;
  END LOOP;
END $$;

-- =====================================================
-- Verification
-- =====================================================

-- Check badge awarding trigger
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_check_badges_on_reputation';

-- Check badge awards
SELECT 
  COUNT(DISTINCT user_id) as users_with_badges,
  COUNT(*) as total_badges_awarded,
  AVG(badge_count)::INTEGER as avg_badges_per_user
FROM (
  SELECT user_id, COUNT(*) as badge_count
  FROM public.user_badges
  GROUP BY user_id
) as badge_counts;

-- Show badge distribution
SELECT 
  b.name,
  b.category,
  COUNT(ub.id) as times_awarded
FROM public.badges b
LEFT JOIN public.user_badges ub ON b.id = ub.badge_id
GROUP BY b.id, b.name, b.category
ORDER BY times_awarded DESC, b."order";
