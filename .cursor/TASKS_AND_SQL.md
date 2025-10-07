# User Profile System - Final Task List & SQL Scripts

## 📋 FINAL CONSOLIDATED TASK LIST

### Phase 1: Database Schema Updates (YOU DO THIS)
1. **Run SQL Migration in Supabase** (see below for exact SQL)
   - Add missing fields to users table (interests, reputation_score, tier)
   - Create badges and user_badges tables
   - Create OAuth profile sync trigger
   - Backfill existing users with OAuth avatars

### Phase 2: OAuth Profile Sync (I DO THIS)
2. Test the OAuth sync trigger with new signups
3. Verify existing users have avatars populated
4. Create optional refresh function and server action

### Phase 3: Profile Editing (I DO THIS)
5. Create profile update server action with Zod schema
6. Build ProfileEditForm component
7. Update settings page from read-only to editable
8. Add interests/tags input component

### Phase 4: Profile Pages Enhancement (I DO THIS)
9. Display interests on public profile pages
10. Add contribution history page/section
11. Show reputation score on profiles

### Phase 5: Badge System (I DO THIS)
12. Define badge criteria (First Post, 10 Posts, etc.)
13. Create badge award logic/triggers
14. Build badge display components
15. Add badge notifications

### Phase 6: Reputation System (I DO THIS)
16. Implement reputation calculation algorithm
17. Add reputation display to profiles
18. Create reputation-based features/permissions

### Phase 7: Tier System (I DO THIS)
19. Implement tier-based feature gates
20. Create upgrade flow (integrate with existing Polar.sh payment)
21. Add tier badges/indicators to profiles

### Phase 8: Testing & Polish (I DO THIS)
22. End-to-end testing of all features
23. Responsive design verification
24. Accessibility audit
25. Documentation updates

---

## 🔧 SQL YOU NEED TO RUN IN SUPABASE

### What Your Current Schema Has:
✅ `public.users` table with basic fields (name, slug, image, bio, work, website, etc.)
✅ `generate_user_slug()` function and trigger
✅ RLS policies on users table
✅ Followers table

### What's Missing:
❌ OAuth profile sync trigger (auth.users → public.users)
❌ Fields: interests, reputation_score, tier
❌ Badges and user_badges tables

---

## 📝 EXACT SQL TO RUN

Copy and paste this into **Supabase SQL Editor** (Database → SQL Editor → New Query):

```sql
-- =====================================================
-- User Profile System - Database Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add missing fields to users table
-- =====================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise'));

-- Create index for reputation queries
CREATE INDEX IF NOT EXISTS idx_users_reputation ON public.users(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);

-- Step 2: Create badges tables
-- =====================================================

-- Badges master table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Icon identifier or emoji
  category TEXT NOT NULL, -- 'engagement', 'contribution', 'milestone', 'special'
  criteria JSONB NOT NULL, -- JSON describing how to earn it
  tier_required TEXT DEFAULT 'free' CHECK (tier_required IN ('free', 'pro', 'enterprise')),
  "order" INTEGER DEFAULT 0, -- Display order
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User badges (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB, -- Optional data about how/when earned
  featured BOOLEAN DEFAULT false, -- User can feature favorite badges
  UNIQUE(user_id, badge_id)
);

-- Indexes for badges
CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_active ON public.badges(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_featured ON public.user_badges(featured) WHERE featured = true;

-- RLS policies for badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (active = true);

CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "Users can feature their own badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 3: Create OAuth profile sync function
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  avatar_url TEXT;
  full_name TEXT;
  user_email TEXT;
BEGIN
  -- Extract avatar URL (GitHub uses 'avatar_url', Google uses 'picture')
  avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  
  -- Extract full name
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name'
  );
  
  -- Get email
  user_email := NEW.email;
  
  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    image,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_email,
    full_name,
    avatar_url,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Backfill OAuth avatars for existing users
-- =====================================================

-- Update existing users who don't have profile pictures
UPDATE public.users u
SET 
  image = COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ),
  name = COALESCE(
    u.name, -- Keep existing name if set
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'user_name'
  ),
  updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
  AND (
    u.image IS NULL 
    OR u.image = ''
    OR u.name IS NULL
    OR u.name = ''
  );

-- Step 5: Create profile refresh function (optional)
-- =====================================================

CREATE OR REPLACE FUNCTION public.refresh_profile_from_oauth(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  auth_user RECORD;
  avatar_url TEXT;
  full_name TEXT;
BEGIN
  -- Get auth.users data
  SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Extract data
  avatar_url := COALESCE(
    auth_user.raw_user_meta_data->>'avatar_url',
    auth_user.raw_user_meta_data->>'picture'
  );
  
  full_name := COALESCE(
    auth_user.raw_user_meta_data->>'full_name',
    auth_user.raw_user_meta_data->>'name',
    auth_user.raw_user_meta_data->>'user_name'
  );
  
  -- Update public.users with latest OAuth data
  UPDATE public.users
  SET 
    name = COALESCE(full_name, name), -- Only update if OAuth provides a name
    image = COALESCE(avatar_url, image), -- Only update if OAuth provides avatar
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_profile_from_oauth(UUID) TO authenticated;

-- Step 6: Insert initial badge definitions
-- =====================================================

INSERT INTO public.badges (slug, name, description, icon, category, criteria, "order") VALUES
  ('first-post', 'First Post', 'Created your first community post', '📝', 'milestone', '{"type": "post_count", "threshold": 1}', 1),
  ('active-contributor', '10 Posts', 'Created 10 community posts', '✍️', 'engagement', '{"type": "post_count", "threshold": 10}', 2),
  ('prolific-writer', '50 Posts', 'Created 50 community posts', '📚', 'engagement', '{"type": "post_count", "threshold": 50}', 3),
  ('popular-post', 'Popular Post', 'Received 10+ votes on a single post', '🔥', 'contribution', '{"type": "post_votes", "threshold": 10}', 4),
  ('viral-post', 'Viral Post', 'Received 50+ votes on a single post', '⭐', 'contribution', '{"type": "post_votes", "threshold": 50}', 5),
  ('early-adopter', 'Early Adopter', 'One of the first 100 users', '🚀', 'special', '{"type": "manual"}', 6),
  ('verified', 'Verified', 'Verified community member', '✓', 'special', '{"type": "manual"}', 7),
  ('contributor', 'Contributor', 'Submitted and merged a configuration', '🎯', 'contribution', '{"type": "submission_merged", "threshold": 1}', 8),
  ('reputation-100', '100 Reputation', 'Earned 100 reputation points', '💯', 'milestone', '{"type": "reputation", "threshold": 100}', 9),
  ('reputation-1000', '1000 Reputation', 'Earned 1000 reputation points', '👑', 'milestone', '{"type": "reputation", "threshold": 1000}', 10)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Migration Complete!
-- =====================================================

-- Verify the migration
SELECT 
  'users table columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('interests', 'reputation_score', 'tier', 'image', 'name')
ORDER BY column_name;

-- Check if trigger exists
SELECT 
  'triggers' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check badge count
SELECT 'badges' as check_type, COUNT(*) as count FROM public.badges;

-- Check users with avatars
SELECT 
  'users with avatars' as check_type,
  COUNT(*) as total_users,
  COUNT(image) as users_with_avatar,
  ROUND(COUNT(image)::numeric / COUNT(*)::numeric * 100, 2) as percentage
FROM public.users;
```

---

## ✅ WHAT TO DO AFTER RUNNING THE SQL

1. **Verify the migration succeeded** - You should see output showing:
   - ✅ New columns added to users table
   - ✅ Trigger created on auth.users
   - ✅ Badges inserted (10 initial badges)
   - ✅ Existing users have avatars populated

2. **Test with a new account** (optional):
   - Sign up with GitHub or Google OAuth
   - Check if profile picture appears automatically
   - Verify name is populated from OAuth

3. **Let me know when done** - Then I'll start implementing the frontend features

---

## 📊 WHAT THIS SQL DOES

### Adds to `public.users`:
- `interests` (JSONB array for tags/skills)
- `reputation_score` (INTEGER, default 0)  
- `tier` (TEXT, default 'free', check constraint for free/pro/enterprise)

### Creates New Tables:
- `badges` - Master list of all available badges
- `user_badges` - Which users have earned which badges

### Creates Trigger:
- `handle_new_user()` - Automatically copies OAuth profile picture and name when users sign up
- Runs on `auth.users` INSERT events

### Backfills Data:
- Updates existing users with their OAuth avatars (if they don't have one)
- Updates existing users with their OAuth names (if they don't have one)

### Seeds Initial Badges:
- First Post, 10 Posts, 50 Posts
- Popular Post, Viral Post
- Early Adopter, Verified
- Contributor
- Reputation milestones

---

## 🚨 IMPORTANT NOTES

- This SQL is **safe to run on production** (uses `IF NOT EXISTS` and `ON CONFLICT`)
- The backfill query only updates users who are missing avatars/names
- The trigger will work for all **new** signups going forward
- Existing logged-in users can refresh their profile later with the refresh function

---

## 🎯 AFTER YOU RUN THIS

I'll be ready to implement:
1. Profile editing UI
2. Interests/tags component  
3. Contribution history page
4. Badge display and award logic
5. Reputation calculation system
6. Tier-based features

**No additional dependencies needed** - everything works with existing Supabase + Next.js setup! 🚀
