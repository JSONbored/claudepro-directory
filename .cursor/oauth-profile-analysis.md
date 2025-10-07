# OAuth Profile Picture Analysis

## User's Question
"Instead of adding avatar uploads, couldn't we just leverage existing github / google profile pictures, since they're authenticating with GitHub OAuth or Google OAuth?"

## Answer: YES! This is much better! ✅

### Why This Is The Right Approach

1. **Simpler Implementation** - No need for Uploadthing integration, image processing, storage, etc.
2. **Better UX** - Users already have profile pictures on GitHub/Google - no friction
3. **Automatic Updates** - If users update their OAuth provider picture, we can refresh it
4. **Cost Savings** - No image storage costs, no Uploadthing subscription needed
5. **Faster Development** - Removes an entire complex feature (SHA-2550) from the roadmap

### What Supabase OAuth Provides

When users sign in with GitHub or Google OAuth, Supabase automatically stores in `auth.users`:

**From GitHub:**
- `raw_user_meta_data.avatar_url` - User's GitHub avatar
- `raw_user_meta_data.full_name` - User's GitHub name  
- `raw_user_meta_data.user_name` - GitHub username
- `raw_user_meta_data.email`

**From Google:**
- `raw_user_meta_data.avatar_url` or `raw_user_meta_data.picture` - Google profile picture
- `raw_user_meta_data.full_name` - User's name
- `raw_user_meta_data.email`

### Current State

**Problem:** We don't have a trigger to automatically sync this OAuth data!

Looking at `supabase/schema.sql`:
- ✅ `public.users` table exists with `image` field
- ❌ NO trigger to sync `auth.users.raw_user_meta_data.avatar_url` to `public.users.image`
- ❌ NO trigger to create a profile when user signs up via OAuth

### What We Need To Do

**Create a database trigger/function that:**
1. Fires when a new user is inserted into `auth.users` (on OAuth signup)
2. Creates a corresponding row in `public.users`
3. Syncs OAuth profile data:
   - `auth.users.raw_user_meta_data.avatar_url` → `public.users.image`
   - `auth.users.raw_user_meta_data.full_name` → `public.users.name`
   - `auth.users.email` → `public.users.email`

### Implementation Plan

#### Step 1: Create Database Function & Trigger

```sql
-- Function to sync OAuth profile data to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### Step 2: (Optional) Add Profile Refresh Function

Allow users to manually refresh their avatar from OAuth provider:

```sql
-- Function to refresh OAuth profile data
CREATE OR REPLACE FUNCTION public.refresh_profile_from_oauth(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Get auth.users data
  SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Update public.users with latest OAuth data
  UPDATE public.users
  SET 
    name = COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'name'),
    image = COALESCE(auth_user.raw_user_meta_data->>'avatar_url', auth_user.raw_user_meta_data->>'picture'),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;
```

#### Step 3: Create Server Action for Profile Refresh

```typescript
// src/lib/actions/profile-actions.ts
export const refreshProfileFromOAuth = authedAction(
  z.object({}),
  async ({}, { user }) => {
    const supabase = await createAdminClient();
    
    // Call the database function
    const { error } = await supabase.rpc('refresh_profile_from_oauth', {
      user_id: user.id
    });
    
    if (error) throw error;
    
    return { success: true, message: 'Profile refreshed from OAuth provider' };
  }
);
```

#### Step 4: Add UI Button (Optional)

In settings page, add a "Refresh from GitHub/Google" button next to avatar.

### Benefits of This Approach

1. **Zero additional dependencies** - No Uploadthing needed
2. **Instant implementation** - Just database triggers + small UI additions
3. **Always up-to-date** - Can refresh from OAuth anytime
4. **Familiar images** - Users see their existing profile pictures
5. **Removes SHA-2550 entirely** - Avatar upload task no longer needed!

### Future Enhancement (Optional)

Later, we could add:
- **Custom avatar uploads** for users who want something different than their OAuth picture
- Store in Supabase Storage (free tier: 1GB) instead of Uploadthing
- But make OAuth profile picture the **default** and **recommended** option

### Updated Implementation Priority

**NEW Phase 3:** OAuth Profile Sync (replaces Avatar Upload)
- Task 3.1: Create database trigger for new user creation ✅ Simple
- Task 3.2: Create refresh function for existing users ✅ Simple  
- Task 3.3: Add "Refresh Profile Picture" button to settings ✅ Simple
- **Estimated Time:** 1-2 hours vs 1-2 days for Uploadthing integration!

### Migration for Existing Users

For users who already signed up before the trigger exists:

```sql
-- One-time migration to sync existing OAuth avatars
UPDATE public.users u
SET 
  image = COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture'),
  name = COALESCE(
    u.name, -- Keep existing name if set
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name'
  )
FROM auth.users au
WHERE u.id = au.id
  AND u.image IS NULL; -- Only update if no image set
```

## Conclusion

**The user's suggestion is brilliant!** This eliminates an entire complex feature (SHA-2550) and replaces it with a simple database trigger. This is the right way to do it.

**Revised task list:**
- ~~SHA-2550: Add avatar upload (Uploadthing)~~ ❌ REMOVED
- **NEW: Sync OAuth profile pictures** ✅ MUCH SIMPLER
