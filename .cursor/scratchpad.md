# User Profile System - Implementation Analysis

## Background and Motivation

The project requires a comprehensive User Profile System implementation to enable users to:
- Create and customize public profiles
- Upload avatars and manage profile images
- Share bio and interests information
- Track contributions and earn badges
- Build reputation through activity
- Access tiered features (free/pro/enterprise)

This is a critical feature for building community engagement and monetization capabilities.

**Linear Tasks:**
- SHA-2547: Design user profile schema
- SHA-2548: Create public profile pages (/u/[username])
- SHA-2549: Build profile edit UI
- SHA-2550: Add avatar upload (Uploadthing)
- SHA-2551: Implement bio and interests
- SHA-2552: Create contribution history page
- SHA-2553: Build badge system
- SHA-2554: Add reputation scoring
- SHA-2555: Create tier system (free/pro/enterprise)

## Key Challenges and Analysis

### Current State Assessment (Completed October 7, 2025)

#### ✅ ALREADY IMPLEMENTED

1. **Database Schema (Partial - SHA-2547)**
   - Users table exists with core fields: id, email, name, slug, image, hero, bio, work, website, social_x_link, status, public, follow_email
   - Followers table for social graph (follower/following relationships)
   - RLS policies properly configured
   - Auto-generated slugs from names
   - **Location:** `supabase/schema.sql` (lines 31-47)

2. **Authentication System**
   - Supabase Auth with Google & GitHub OAuth fully functional
   - Auth buttons component: `src/components/auth/auth-buttons.tsx`
   - Auth callback route: `src/app/auth/callback/route.ts`
   - Supabase clients (browser, server, admin) properly configured

3. **Public Profile Pages (SHA-2548)**
   - Route exists: `src/app/u/[slug]/page.tsx`
   - Displays: avatar, hero image, name, bio, work, website, follower/following counts
   - Shows recent posts
   - Follow button (disabled currently)
   - **Status:** Basic implementation exists but needs enhancement

4. **Account Dashboard**
   - `/account/page.tsx` - Shows bookmarks count, account age, status
   - `/account/layout.tsx` - Navigation structure for account pages
   - Basic profile information display

5. **Settings Page (Read-Only)**
   - `/account/settings/page.tsx` exists but is READ-ONLY
   - Shows: email, user ID, profile URL, member since date
   - Explicitly marked as "Coming Soon" for editing features

6. **Follow System**
   - Database table: `followers` (follower_id, following_id)
   - Server actions: `src/lib/actions/follow-actions.ts`
   - Functions: `isFollowing()`, follow/unfollow actions
   - **Status:** Backend complete, UI partially implemented

7. **Related Systems**
   - Bookmarks (fully functional)
   - Posts & comments (community board)
   - Submissions system
   - Companies profiles

#### ❌ NOT IMPLEMENTED

1. **Profile Edit UI (SHA-2549)**
   - **Gap:** No form or interface to edit profile fields
   - **Missing:** Name, bio, work, website, social links editing
   - **Current:** Settings page is read-only with "Coming Soon" message
   - **Required:** Create editable form with validation and server actions

2. **OAuth Profile Picture Sync (SHA-2550 REVISED)**
   - **Gap:** No database trigger to sync OAuth avatars to public.users
   - **Current:** `image` field exists but not populated from OAuth providers
   - **Missing:** Trigger to copy `auth.users.raw_user_meta_data.avatar_url` to `public.users.image`
   - **Better Approach:** Use GitHub/Google OAuth profile pictures (no upload needed!)
   - **Required:** Database trigger to auto-sync OAuth data on signup

3. **Interests/Skills Field (SHA-2551 Partial)**
   - **Gap:** No `interests` field in users table
   - **Current:** Only `bio` field exists (TEXT type)
   - **Missing:** Structured interests/tags field (JSONB array)
   - **Required:** Database migration + UI for tag selection/input

4. **Contribution History Page (SHA-2552)**
   - **Gap:** No dedicated page tracking user contributions
   - **Missing:** Aggregated view of posts, submissions, comments, votes
   - **Current:** Only shows recent posts on profile page
   - **Required:** Comprehensive activity timeline with filtering

5. **Badge System (SHA-2553)**
   - **Gap:** No badges table or implementation
   - **Missing:** 
     - Database schema for badges and user_badges tables
     - Badge award logic
     - Badge display components
     - Achievement criteria system
   - **Required:** Full badge system from scratch

6. **Reputation Scoring (SHA-2554)**
   - **Gap:** No reputation field or calculation system
   - **Missing:**
     - Reputation score field in users table
     - Scoring algorithm (posts, votes, contributions)
     - Reputation display UI
     - Reputation-based permissions/features
   - **Required:** Design scoring system, add field, implement calculations

7. **Tier System (SHA-2555)**
   - **Gap:** No user tier/plan system
   - **Current:** Only payment/subscription tables exist for products (jobs, MCPs)
   - **Missing:**
     - User tier field (free/pro/enterprise)
     - Tier-based feature gates
     - Upgrade/downgrade flows
     - Tier benefits documentation
   - **Required:** Complete tier infrastructure

### Architecture Observations

**Strengths:**
- Well-structured Next.js 15 app with App Router
- TypeScript with Zod schemas throughout
- Supabase integration properly configured
- RLS policies in place for security
- Server Actions pattern for mutations
- Consistent UI component library

**Tech Stack:**
- Next.js 15.5
- React 19.1
- TypeScript 5.9
- Supabase (auth + database)
- Tailwind CSS v4.1
- Zod for validation
- next-safe-action for server actions
- No Uploadthing dependency yet

**Patterns to Follow:**
- Server Actions in `src/lib/actions/*`
- Zod schemas in `src/lib/schemas/*`
- Supabase client patterns (browser/server/admin)
- UI components in `src/components/ui/*`
- Feature components in `src/components/features/*`

### Dependencies Needed

**GOOD NEWS:** No additional dependencies needed!
- ~~`uploadthing`~~ - Not needed! Using OAuth profile pictures instead ✅
- OAuth providers (GitHub/Google) already provide avatars via Supabase Auth

### Security Considerations

- RLS policies must be updated for new tables (badges, user_badges)
- Profile edit actions need proper authorization checks
- Image uploads require file type/size validation
- Reputation calculations should prevent gaming/abuse
- Tier-based features need server-side enforcement

## High-level Task Breakdown

### Phase 1: Database Schema Completion
**Goal:** Extend database schema with missing fields and tables

#### Task 1.1: Add Missing User Fields
- [ ] Add `interests` JSONB field to users table
- [ ] Add `reputation_score` INTEGER field to users table (default 0)
- [ ] Add `tier` TEXT field to users table (default 'free')
- [ ] Create database migration script
- [ ] Test migration on development database
- **Success Criteria:** Migration runs successfully, new fields accessible via Supabase

#### Task 1.2: Create Badge System Tables
- [ ] Design badges table schema (id, name, description, icon, criteria, tier_required)
- [ ] Design user_badges table schema (user_id, badge_id, earned_at, metadata)
- [ ] Add RLS policies for both tables
- [ ] Create indexes for performance
- [ ] Seed initial badge data
- **Success Criteria:** Tables created, RLS working, can query badges

### Phase 2: Profile Edit Infrastructure (SHA-2549)
**Goal:** Enable users to edit their profile information

#### Task 2.1: Create Profile Update Server Action
- [ ] Create Zod schema for profile updates (`src/lib/schemas/profile.schema.ts`)
- [ ] Create `updateProfile` action in `src/lib/actions/profile-actions.ts`
- [ ] Add proper authorization checks
- [ ] Add validation for slug uniqueness
- [ ] Add rate limiting
- **Success Criteria:** Action successfully updates user profile, validates input

#### Task 2.2: Build Profile Edit Form Component
- [ ] Create ProfileEditForm component (`src/components/features/profile/profile-edit-form.tsx`)
- [ ] Add form fields: name, bio, work, website, social_x_link, interests (tags)
- [ ] Add form validation (client + server)
- [ ] Add loading states and error handling
- [ ] Add success toast notifications
- **Success Criteria:** Form submits, updates profile, shows feedback

#### Task 2.3: Update Settings Page
- [ ] Replace read-only display with edit form
- [ ] Add cancel/save buttons
- [ ] Add unsaved changes warning
- [ ] Test all form fields
- **Success Criteria:** Settings page allows editing and saving changes

### Phase 3: OAuth Profile Picture Sync (SHA-2550 REVISED - Much Simpler!)
**Goal:** Automatically sync profile pictures from GitHub/Google OAuth

#### Task 3.1: Create Database Trigger for OAuth Sync
- [ ] Create `handle_new_user()` function to sync OAuth data on signup
- [ ] Add trigger on `auth.users` INSERT to populate `public.users`
- [ ] Sync: avatar_url → image, full_name → name, email → email
- [ ] Test with new GitHub and Google OAuth signups
- **Success Criteria:** New users automatically get profile picture from OAuth provider

#### Task 3.2: Migrate Existing Users
- [ ] Write migration query to backfill OAuth avatars for existing users
- [ ] Run migration on existing user base
- [ ] Verify all existing users now have avatars
- **Success Criteria:** Existing users' OAuth profile pictures appear

#### Task 3.3: Add Profile Refresh Feature (Optional)
- [ ] Create `refresh_profile_from_oauth()` database function
- [ ] Create server action to call refresh function
- [ ] Add "Refresh from GitHub/Google" button to settings
- [ ] Test refresh functionality
- **Success Criteria:** Users can manually refresh their OAuth profile picture

**Time Savings:** 1-2 hours vs 1-2 days for Uploadthing! 🎉

### Phase 4: Interests Implementation (SHA-2551)
**Goal:** Allow users to add interests/skills tags

#### Task 4.1: Create Interests Input Component
- [ ] Create InterestsInput component with tag selection
- [ ] Add autocomplete for common interests
- [ ] Allow custom interest entry
- [ ] Limit to reasonable number (e.g., 10 tags)
- [ ] Style with Badge components
- **Success Criteria:** Users can add/remove interests, stored as JSONB

#### Task 4.2: Display Interests on Profile
- [ ] Add interests section to profile page (`/u/[slug]`)
- [ ] Style interests as badges/pills
- [ ] Make interests searchable/filterable (future enhancement)
- **Success Criteria:** Interests visible on public profile

### Phase 5: Contribution History Page (SHA-2552)
**Goal:** Create comprehensive activity timeline

#### Task 5.1: Create Contribution Data Aggregation
- [ ] Create server function to aggregate user activity
- [ ] Query posts, comments, submissions, votes
- [ ] Calculate contribution stats
- [ ] Add pagination support
- **Success Criteria:** Function returns complete activity data

#### Task 5.2: Build Contribution History Page
- [ ] Create route: `/account/contributions` or `/u/[slug]/activity`
- [ ] Display timeline of all user activities
- [ ] Add filtering by type (posts, comments, submissions)
- [ ] Add date range filtering
- [ ] Show contribution graphs/charts
- **Success Criteria:** Page shows complete user activity history

### Phase 6: Badge System (SHA-2553)
**Goal:** Implement achievement badges

#### Task 6.1: Define Badge Criteria System
- [ ] Design badge definitions (First Post, 10 Posts, Popular Post, etc.)
- [ ] Create badge award logic functions
- [ ] Add badge checking triggers/scheduled jobs
- [ ] Test badge award flow
- **Success Criteria:** Badges automatically awarded based on criteria

#### Task 6.2: Create Badge Display Components
- [ ] Create Badge component for displaying badges
- [ ] Create BadgeList component for profile
- [ ] Add badge detail modal
- [ ] Add badge progress indicators
- **Success Criteria:** Badges display on profile, clickable for details

#### Task 6.3: Add Badge Management
- [ ] Add badge notifications when earned
- [ ] Add badge showcase section to profile
- [ ] Allow users to feature favorite badges
- **Success Criteria:** Users notified of new badges, can showcase them

### Phase 7: Reputation Scoring (SHA-2554)
**Goal:** Calculate and display reputation scores

#### Task 7.1: Design Reputation Algorithm
- [ ] Define scoring rules (post votes, comments, accepted submissions)
- [ ] Create reputation calculation function
- [ ] Add triggers for reputation updates
- [ ] Add reputation decay mechanism (optional)
- [ ] Test scoring algorithm
- **Success Criteria:** Reputation scores calculated accurately

#### Task 7.2: Display Reputation
- [ ] Add reputation to profile page
- [ ] Add reputation badge/icon
- [ ] Add reputation leaderboard (optional)
- [ ] Show reputation history/breakdown
- **Success Criteria:** Reputation visible on profiles

#### Task 7.3: Reputation-Based Features
- [ ] Add reputation requirements for certain actions
- [ ] Add reputation milestones/achievements
- [ ] Integrate with badge system
- **Success Criteria:** Reputation unlocks features/privileges

### Phase 8: Tier System (SHA-2555)
**Goal:** Implement free/pro/enterprise tiers

#### Task 8.1: Add Tier Infrastructure
- [ ] Add tier field to users table (already planned in 1.1)
- [ ] Define tier benefits (storage limits, features, etc.)
- [ ] Create tier gating utility functions
- [ ] Add tier display components
- **Success Criteria:** Tier system in database, utility functions work

#### Task 8.2: Create Upgrade Flow
- [ ] Add "Upgrade" button/CTA
- [ ] Create pricing page
- [ ] Integrate with payment system (Polar.sh exists)
- [ ] Add tier change webhooks
- **Success Criteria:** Users can upgrade tiers via payment

#### Task 8.3: Implement Tier-Based Features
- [ ] Gate features by tier (e.g., unlimited bookmarks, priority support)
- [ ] Add tier badges/indicators
- [ ] Show tier benefits on profile
- **Success Criteria:** Features properly gated by tier

### Phase 9: Testing & Polish
**Goal:** Ensure all features work correctly

#### Task 9.1: Integration Testing
- [ ] Test complete profile creation flow
- [ ] Test profile editing and image upload
- [ ] Test badge earning and display
- [ ] Test reputation calculations
- [ ] Test tier upgrades
- **Success Criteria:** All flows work end-to-end

#### Task 9.2: UI/UX Polish
- [ ] Ensure responsive design on all pages
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add helpful tooltips/hints
- [ ] Accessibility audit
- **Success Criteria:** Smooth, polished user experience

#### Task 9.3: Documentation
- [ ] Document new database schema
- [ ] Document API/server actions
- [ ] Add user-facing help docs
- [ ] Update README with new features
- **Success Criteria:** Features documented for developers and users

## Additional Tasks/Considerations

### Missing from Original List:

1. **Profile Picture Fallback**
   - Implement avatar generation for users without uploaded images
   - Consider using initial letters or identicons

2. **Profile Completeness Indicator**
   - Add progress bar showing profile completion %
   - Encourage users to fill out all fields

3. **Profile Privacy Controls**
   - Extend `public` field with more granular controls
   - Allow hiding specific sections (email, activity, etc.)

4. **Social Features**
   - Make follow button functional (currently disabled)
   - Add follow notifications
   - Add activity feed for followed users

5. **Profile Analytics**
   - Track profile views
   - Show view count to profile owner
   - Add profile analytics dashboard

6. **Username/Slug Changes**
   - Allow users to change slug (with restrictions)
   - Handle redirects from old slugs
   - Prevent slug squatting

7. **Profile Verification**
   - Add verification badge for verified accounts
   - Verification process/criteria

## Project Status Board

### 🔴 Not Started

#### Database & Schema
- [ ] Add `interests` JSONB field to users table
- [ ] Add `reputation_score` INTEGER field
- [ ] Add `tier` TEXT field
- [ ] Create badges table
- [ ] Create user_badges table
- [ ] Write and test database migrations

#### Profile Editing
- [ ] Create profile update server action
- [ ] Create Zod schema for profile updates
- [ ] Build ProfileEditForm component
- [ ] Update settings page with edit form
- [ ] Add form validation and error handling

#### OAuth Profile Sync (REVISED - Much Simpler!)
- [ ] Create database trigger for new user OAuth sync
- [ ] Migrate existing users to populate OAuth avatars
- [ ] Add profile refresh function (optional)
- [ ] Add "Refresh Profile Picture" button (optional)

#### Interests/Bio
- [ ] Create InterestsInput component
- [ ] Add interests display to profile page
- [ ] Add autocomplete for common interests

#### Contribution History
- [ ] Create contribution aggregation function
- [ ] Build contribution history page
- [ ] Add activity timeline component
- [ ] Add filtering and pagination

#### Badge System
- [ ] Define badge criteria and types
- [ ] Implement badge award logic
- [ ] Create badge display components
- [ ] Add badge notifications
- [ ] Build badge showcase section

#### Reputation System
- [ ] Design reputation algorithm
- [ ] Implement reputation calculation
- [ ] Add reputation display to profiles
- [ ] Create reputation leaderboard
- [ ] Add reputation-based features

#### Tier System
- [ ] Implement tier infrastructure
- [ ] Create upgrade flow and pricing
- [ ] Add tier-based feature gates
- [ ] Integrate with payment system

#### Testing & Polish
- [ ] Integration testing all flows
- [ ] UI/UX polish and responsive design
- [ ] Accessibility audit
- [ ] Documentation updates

### 🟡 In Progress
- None (waiting for planner approval)

### 🟢 Completed
- [x] Database schema foundation (users, followers tables)
- [x] Authentication system (GitHub/Google OAuth)
- [x] Basic public profile pages (/u/[slug])
- [x] Account dashboard
- [x] Follow system (backend complete)
- [x] Bookmarks system

### ❌ Blocked
- None currently

## Executor's Feedback or Assistance Requests

**Status:** Awaiting planner/human user approval to proceed with implementation.

**Questions for User:**
1. Should we implement tasks sequentially or prioritize certain features?
2. Are there any specific design preferences for the UI components?
3. ~~Do you have Uploadthing account/API keys ready?~~ NOT NEEDED - using OAuth pictures! ✅
4. What should the reputation algorithm prioritize (posts, votes, contributions)?
5. What tier benefits should we implement for free/pro/enterprise?
6. Should profile slugs be changeable or permanent?
7. Should we add custom avatar upload later, or OAuth-only is sufficient?

**Recommendations:**
1. Start with Phase 1 (Database Schema) as foundation
2. Then Phase 3 (OAuth Profile Sync) - **Now super quick!** Just database triggers
3. Then Phase 2 (Profile Edit UI) for immediate user value
4. Phases 4-8 can be done in parallel after foundations complete
5. Consider using TDD approach for server actions and reputation logic

**Major Win:** Eliminating Uploadthing saves significant development time and complexity! 🎉

## Lessons

### Technical Decisions
- Following existing patterns in codebase (server actions, Zod schemas, Supabase)
- Using JSONB for flexible data like interests/tags
- RLS policies must be added for all new tables
- ~~Image uploads should go through Uploadthing~~ ❌ 
- **USE OAuth profile pictures from GitHub/Google** ✅ Much simpler and better UX!
- Supabase Auth already provides `raw_user_meta_data.avatar_url` from OAuth providers

### Security Notes
- Always verify user authentication in server actions
- Validate and sanitize all user inputs
- Check ownership before allowing profile edits
- Implement rate limiting on uploads and updates
- Use RLS policies as primary security layer

### Performance Considerations
- Add database indexes for frequently queried fields (slug, tier, reputation_score)
- Paginate contribution history and activity feeds
- Cache reputation calculations
- Optimize badge checking (don't run on every request)

### Key Realizations
- **OAuth Profile Pictures:** User suggested leveraging GitHub/Google OAuth avatars instead of Uploadthing
- This eliminates SHA-2550 entirely and replaces it with a simple database trigger
- Saves 1-2 days of development time and ongoing image storage costs
- Better UX since users already have profile pictures
- Can add custom uploads later if needed, but OAuth should be default

---

**Last Updated:** October 7, 2025
**Status:** Planning Phase - Awaiting Approval
**Major Update:** SHA-2550 revised to use OAuth profile pictures (much simpler approach)
