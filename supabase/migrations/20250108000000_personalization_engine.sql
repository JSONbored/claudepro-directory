-- =====================================================
-- Personalization Engine - Database Schema
-- =====================================================
-- Implements data infrastructure for personalized recommendations
-- Includes: user interactions, affinity scores, similarity matrices
-- 
-- Related Linear Issues:
-- - SHA-2567: Build recommendation service
-- - SHA-2568: Implement affinity scoring algorithm
-- - SHA-2569: Add collaborative filtering
-- - SHA-2570: Create "For You" feed
-- - SHA-2571: Build similar configs feature
-- - SHA-2573: Implement usage-based recommendations
-- =====================================================

-- =====================================================
-- PHASE 1: USER INTERACTION TRACKING
-- =====================================================

-- User interaction events (clickstream analytics)
-- Tracks all user interactions with content for building personalization models
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections')),
  content_slug TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'copy', 'bookmark', 'click', 'time_spent')),
  
  -- Session tracking
  session_id TEXT,
  
  -- Context data
  metadata JSONB DEFAULT '{}', -- { time_spent_seconds: N, referrer: "...", etc }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_content ON public.user_interactions(content_type, content_slug);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session ON public.user_interactions(session_id) WHERE session_id IS NOT NULL;

-- =====================================================
-- PHASE 2: USER AFFINITY SCORES
-- =====================================================

-- User content affinity scores (precomputed)
-- Stores calculated affinity between users and content items
CREATE TABLE IF NOT EXISTS public.user_affinities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections')),
  content_slug TEXT NOT NULL,
  
  -- Affinity score (0-100)
  affinity_score NUMERIC(5,2) NOT NULL CHECK (affinity_score >= 0 AND affinity_score <= 100),
  
  -- Breakdown of score components
  based_on JSONB DEFAULT '{}', -- { views: N, bookmarks: N, copies: N, time_spent: N, recency_boost: N }
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicates
  UNIQUE(user_id, content_type, content_slug)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_affinities_user_id ON public.user_affinities(user_id, affinity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_affinities_content ON public.user_affinities(content_type, content_slug);
CREATE INDEX IF NOT EXISTS idx_user_affinities_score ON public.user_affinities(affinity_score DESC) WHERE affinity_score >= 50;

-- =====================================================
-- PHASE 3: SIMILARITY MATRICES
-- =====================================================

-- User similarity matrix (for collaborative filtering)
-- Stores similarity scores between users based on interaction patterns
CREATE TABLE IF NOT EXISTS public.user_similarities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_b_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Similarity score (0-1, using cosine similarity)
  similarity_score NUMERIC(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  
  -- Metadata
  common_items INTEGER DEFAULT 0, -- Number of items both users interacted with
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicates and self-similarity
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id) -- Ensures only one direction stored (A→B, not B→A)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_similarities_user_a ON public.user_similarities(user_a_id, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_similarities_user_b ON public.user_similarities(user_b_id, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_similarities_score ON public.user_similarities(similarity_score DESC) WHERE similarity_score >= 0.5;

-- Content similarity matrix (for "similar configs" feature)
-- Stores similarity scores between content items
CREATE TABLE IF NOT EXISTS public.content_similarities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_a_type TEXT NOT NULL CHECK (content_a_type IN ('agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections')),
  content_a_slug TEXT NOT NULL,
  content_b_type TEXT NOT NULL CHECK (content_b_type IN ('agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections')),
  content_b_slug TEXT NOT NULL,
  
  -- Similarity score (0-1)
  similarity_score NUMERIC(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  
  -- Breakdown of similarity factors
  similarity_factors JSONB DEFAULT '{}', -- { tag_overlap: 0.8, category_match: 1.0, co_bookmark: 0.6 }
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicates
  UNIQUE(content_a_type, content_a_slug, content_b_type, content_b_slug)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_similarities_content_a ON public.content_similarities(content_a_type, content_a_slug, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_similarities_content_b ON public.content_similarities(content_b_type, content_b_slug);
CREATE INDEX IF NOT EXISTS idx_content_similarities_score ON public.content_similarities(similarity_score DESC) WHERE similarity_score >= 0.3;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_affinities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_similarities ENABLE ROW LEVEL SECURITY;

-- User Interactions: Users can only see and manage their own interactions
CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Affinities: Users can only see their own affinity scores
CREATE POLICY "Users can view their own affinities"
  ON public.user_affinities FOR SELECT
  USING (auth.uid() = user_id);

-- User Similarities: Users can see similarities involving themselves
CREATE POLICY "Users can view their own similarities"
  ON public.user_similarities FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Content Similarities: Public read access (no user context needed)
CREATE POLICY "Content similarities are viewable by everyone"
  ON public.content_similarities FOR SELECT
  USING (true);

-- Service role has full access for batch operations
CREATE POLICY "Service role has full access to interactions"
  ON public.user_interactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to affinities"
  ON public.user_affinities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to user similarities"
  ON public.user_similarities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to content similarities"
  ON public.content_similarities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to clean up old interaction data (>90 days)
-- Keeps database size manageable while preserving recent data
CREATE OR REPLACE FUNCTION public.cleanup_old_interactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_interactions
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute to service role for cron jobs
GRANT EXECUTE ON FUNCTION public.cleanup_old_interactions() TO service_role;

-- =====================================================
-- INITIAL SETUP COMPLETE
-- =====================================================
-- Schema includes:
--   ✅ User interaction tracking
--   ✅ User affinity scores
--   ✅ User similarity matrix (collaborative filtering)
--   ✅ Content similarity matrix (similar configs)
--   ✅ Performance indexes
--   ✅ RLS policies
--   ✅ Cleanup functions
--
-- Next steps:
--   1. Implement affinity scoring algorithm
--   2. Create cron jobs for batch calculations
--   3. Build For You feed
--   4. Add similar configs to detail pages
-- =====================================================
