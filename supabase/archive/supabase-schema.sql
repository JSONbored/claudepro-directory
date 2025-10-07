-- =====================================================
-- ClaudePro Directory - Supabase Database Schema
-- =====================================================
-- Run this in Supabase SQL Editor (Database → SQL Editor → New Query)
-- This creates all tables, RLS policies, and functions needed
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
-- Stores public profile information and preferences
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT,
  slug TEXT UNIQUE,
  image TEXT, -- Avatar URL
  hero TEXT, -- Hero/banner image URL
  bio TEXT,
  work TEXT, -- Job title/company
  website TEXT,
  social_x_link TEXT, -- Twitter/X profile
  status TEXT DEFAULT 'active', -- active, suspended, deleted
  public BOOLEAN DEFAULT true, -- Public profile visibility
  follow_email BOOLEAN DEFAULT true, -- Email notifications for new followers
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bookmarks table
-- Users can bookmark any content (agents, mcp, rules, etc.)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL, -- 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides', 'collections'
  content_slug TEXT NOT NULL,
  notes TEXT, -- Optional personal notes
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, content_type, content_slug)
);

-- Followers table (social graph)
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  size TEXT, -- '1-10', '11-50', '51-200', '201-500', '500+'
  industry TEXT,
  using_cursor_since DATE,
  featured BOOLEAN DEFAULT false, -- PAID feature
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Jobs table (migrated from static JSON)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- Job details
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL, -- Denormalized for display
  location TEXT,
  description TEXT NOT NULL,
  salary TEXT,
  remote BOOLEAN DEFAULT false,
  type TEXT NOT NULL, -- 'full-time', 'part-time', 'contract', 'internship'
  workplace TEXT, -- 'On site', 'Remote', 'Hybrid'
  experience TEXT, -- 'Entry', 'Mid', 'Senior', 'Lead'
  category TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  requirements JSONB NOT NULL DEFAULT '[]',
  benefits JSONB NOT NULL DEFAULT '[]',
  link TEXT NOT NULL, -- Apply URL
  contact_email TEXT,
  company_logo TEXT,
  
  -- Business fields
  plan TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'featured', 'premium'
  active BOOLEAN DEFAULT false, -- Activated after payment (or true for standard)
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'expired', 'paused'
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0, -- For manual ordering
  
  -- Analytics (denormalized)
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User-submitted MCP servers (monetized)
CREATE TABLE IF NOT EXISTS public.user_mcps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- MCP details
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo TEXT,
  link TEXT NOT NULL, -- GitHub/documentation URL
  mcp_link TEXT, -- MCP-specific link
  
  -- Business fields
  plan TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'featured', 'premium'
  active BOOLEAN DEFAULT false, -- Activated after payment (or true for standard)
  "order" INTEGER DEFAULT 0,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User-submitted content (agents, rules, commands, etc.)
CREATE TABLE IF NOT EXISTS public.user_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content details
  content_type TEXT NOT NULL, -- 'agent', 'rule', 'command', 'hook', 'collection'
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL, -- Full configuration
  tags JSONB DEFAULT '[]',
  
  -- Business fields
  plan TEXT NOT NULL DEFAULT 'standard',
  active BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(content_type, slug)
);

-- Posts table (community board like Hacker News)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Post details
  title TEXT NOT NULL,
  content TEXT, -- Optional body text
  url TEXT, -- Optional link
  
  -- Analytics
  vote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Votes table (post upvotes)
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payments table (Polar.sh transaction records)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Polar.sh data
  polar_transaction_id TEXT UNIQUE NOT NULL,
  polar_checkout_id TEXT,
  polar_customer_id TEXT,
  
  -- Payment details
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'USD' NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  
  -- Product reference
  product_type TEXT NOT NULL, -- 'job_listing', 'mcp_listing', 'user_content', 'subscription'
  product_id UUID, -- References jobs.id, user_mcps.id, etc.
  plan TEXT, -- 'standard', 'featured', 'premium'
  
  -- Metadata
  metadata JSONB,
  
  -- Audit
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscriptions table (recurring billing)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Polar.sh data
  polar_subscription_id TEXT UNIQUE NOT NULL,
  polar_customer_id TEXT,
  polar_product_id TEXT,
  
  -- Subscription details
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due', 'paused'
  
  -- Billing periods
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Product reference (what subscription unlocks)
  product_type TEXT, -- 'job_listing', 'mcp_listing', 'premium_membership'
  product_id UUID,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ
);

-- Sponsored content table (promoted items in feeds)
CREATE TABLE IF NOT EXISTS public.sponsored_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Content reference
  content_type TEXT NOT NULL, -- 'mcp', 'agent', 'job', etc.
  content_id UUID NOT NULL,
  
  -- Sponsorship details
  tier TEXT NOT NULL, -- 'featured', 'promoted', 'spotlight'
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Budget/limits
  impression_limit INTEGER,
  impression_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sponsored impressions (analytics)
CREATE TABLE IF NOT EXISTS public.sponsored_impressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsored_id UUID REFERENCES public.sponsored_content(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  page_url TEXT,
  position INTEGER, -- Position in feed
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sponsored clicks (analytics)
CREATE TABLE IF NOT EXISTS public.sponsored_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsored_id UUID REFERENCES public.sponsored_content(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Submissions (community content submissions via /submit)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content details
  content_type TEXT NOT NULL CHECK (content_type IN ('agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines')),
  content_slug TEXT NOT NULL,
  content_name TEXT NOT NULL,
  
  -- GitHub PR details
  pr_number INTEGER,
  pr_url TEXT,
  branch_name TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  
  -- Metadata
  submission_data JSONB NOT NULL,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  merged_at TIMESTAMPTZ,
  
  -- Prevent duplicate submissions
  UNIQUE(content_type, content_slug)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_slug ON public.users(slug);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content ON public.bookmarks(content_type, content_slug);

-- Followers
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_featured ON public.companies(featured) WHERE featured = true;

-- Jobs
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON public.jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_plan ON public.jobs(plan);

-- User MCPs
CREATE INDEX IF NOT EXISTS idx_user_mcps_slug ON public.user_mcps(slug);
CREATE INDEX IF NOT EXISTS idx_user_mcps_user_id ON public.user_mcps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mcps_active ON public.user_mcps(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_mcps_plan ON public.user_mcps(plan);

-- User Content
CREATE INDEX IF NOT EXISTS idx_user_content_user_id ON public.user_content(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_type ON public.user_content(content_type);
CREATE INDEX IF NOT EXISTS idx_user_content_active ON public.user_content(active) WHERE active = true;

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_vote_count ON public.posts(vote_count DESC);

-- Votes
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON public.votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_polar_transaction_id ON public.payments(polar_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_product ON public.payments(product_type, product_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_id ON public.subscriptions(polar_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Sponsored Content
CREATE INDEX IF NOT EXISTS idx_sponsored_content_active ON public.sponsored_content(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_sponsored_content_dates ON public.sponsored_content(start_date, end_date);

-- Submissions
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_content_type ON public.submissions(content_type);
CREATE INDEX IF NOT EXISTS idx_submissions_pr_number ON public.submissions(pr_number) WHERE pr_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_mcps_updated_at BEFORE UPDATE ON public.user_mcps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_content_updated_at BEFORE UPDATE ON public.user_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsored_content_updated_at BEFORE UPDATE ON public.sponsored_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_slug_from_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(
      lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g')),
      '\s+', '-', 'g'
    );
    
    -- Ensure uniqueness by appending number if needed
    WHILE EXISTS (
      SELECT 1 FROM public.jobs WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      NEW.slug := NEW.slug || '-' || floor(random() * 10000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply slug generation to tables
CREATE TRIGGER generate_job_slug BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION generate_slug_from_name();

CREATE TRIGGER generate_user_mcp_slug BEFORE INSERT ON public.user_mcps
  FOR EACH ROW EXECUTE FUNCTION generate_slug_from_name();

-- Function to auto-generate user slug from name
CREATE OR REPLACE FUNCTION generate_user_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Use email username as base
    NEW.slug := split_part(NEW.email, '@', 1);
    NEW.slug := regexp_replace(lower(NEW.slug), '[^a-z0-9-]', '-', 'g');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.users WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || floor(random() * 10000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_users_slug BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION generate_user_slug();

-- Function to update vote_count on posts
CREATE OR REPLACE FUNCTION update_post_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vote_count_on_insert AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_post_vote_count();

CREATE TRIGGER update_vote_count_on_delete AFTER DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_post_vote_count();

-- Function to get popular posts (RPC for complex query)
CREATE OR REPLACE FUNCTION get_popular_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  url TEXT,
  vote_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMPTZ,
  user_name TEXT,
  user_avatar TEXT,
  user_slug TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.url,
    p.vote_count,
    p.comment_count,
    p.created_at,
    u.name as user_name,
    u.image as user_avatar,
    u.slug as user_slug
  FROM public.posts p
  LEFT JOIN public.users u ON u.id = p.user_id
  ORDER BY p.vote_count DESC, p.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION is_following(follower_user_id UUID, following_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.followers 
    WHERE follower_id = follower_user_id 
    AND following_id = following_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mcps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_clicks ENABLE ROW LEVEL SECURITY;

-- Users: Public profiles visible to all, own profile editable
CREATE POLICY "Public users are viewable by everyone"
  ON public.users FOR SELECT
  USING (public = true OR auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Bookmarks: Users can only see and manage their own
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Followers: Anyone can view, users can manage their own follows
CREATE POLICY "Followers are viewable by everyone"
  ON public.followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Companies: Public viewable, owners can manage
CREATE POLICY "Companies are viewable by everyone"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "Users can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Company owners can update their companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = owner_id);

-- Jobs: Active jobs viewable by all, users can manage their own
CREATE POLICY "Active jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- User MCPs: Active MCPs viewable by all, users can manage their own
CREATE POLICY "Active MCPs are viewable by everyone"
  ON public.user_mcps FOR SELECT
  USING (active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create MCPs"
  ON public.user_mcps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MCPs"
  ON public.user_mcps FOR UPDATE
  USING (auth.uid() = user_id);

-- User Content: Active content viewable by all, users can manage their own
CREATE POLICY "Active user content is viewable by everyone"
  ON public.user_content FOR SELECT
  USING (active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create content"
  ON public.user_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
  ON public.user_content FOR UPDATE
  USING (auth.uid() = user_id);

-- Posts: All posts viewable, users can create/update their own
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Votes: Users can vote and see all votes
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments: All comments viewable, users can create/manage their own
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Payments: Users can only see their own payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Sponsored Content: Active sponsored content viewable by all
CREATE POLICY "Active sponsored content is viewable by everyone"
  ON public.sponsored_content FOR SELECT
  USING (active = true);

-- Sponsored Impressions: Anyone can record impressions
CREATE POLICY "Anyone can record sponsored impressions"
  ON public.sponsored_impressions FOR INSERT
  WITH CHECK (true);

-- Sponsored Clicks: Anyone can record clicks
CREATE POLICY "Anyone can record sponsored clicks"
  ON public.sponsored_clicks FOR INSERT
  WITH CHECK (true);

-- Submissions: Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to submissions"
  ON public.submissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- INITIAL SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Setup OAuth providers in Supabase Authentication settings
-- 3. Configure Vercel environment variables
-- =====================================================
