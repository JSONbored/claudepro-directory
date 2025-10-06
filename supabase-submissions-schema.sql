-- ============================================================================
-- SUBMISSIONS TABLE
-- Tracks community content submissions and their PR status
-- ============================================================================

-- Drop existing table if exists (for clean re-run)
DROP TABLE IF EXISTS public.submissions CASCADE;

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
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
  submission_data JSONB NOT NULL, -- Stores full submission payload
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merged_at TIMESTAMPTZ,
  
  -- Prevent duplicate submissions
  UNIQUE(content_type, content_slug)
);

-- Indexes for performance
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_content_type ON public.submissions(content_type);
CREATE INDEX idx_submissions_pr_number ON public.submissions(pr_number) WHERE pr_number IS NOT NULL;
CREATE INDEX idx_submissions_created_at ON public.submissions(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submissions_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can create submissions"
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete submissions
-- (Only system/admin can update status)

-- Service role can do everything (for webhooks/admin actions)
CREATE POLICY "Service role has full access to submissions"
  ON public.submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's submission count
CREATE OR REPLACE FUNCTION get_user_submission_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.submissions
  WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE;

-- Get user's approved submission count
CREATE OR REPLACE FUNCTION get_user_approved_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.submissions
  WHERE user_id = user_uuid
    AND status IN ('approved', 'merged');
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.submissions IS 'Community content submissions with PR tracking';
COMMENT ON COLUMN public.submissions.content_type IS 'Type of content: agents, mcp, rules, commands, hooks, statuslines';
COMMENT ON COLUMN public.submissions.content_slug IS 'URL-friendly slug for the content';
COMMENT ON COLUMN public.submissions.status IS 'Submission status: pending, approved, rejected, merged';
COMMENT ON COLUMN public.submissions.pr_number IS 'GitHub PR number if created';
COMMENT ON COLUMN public.submissions.submission_data IS 'Full JSON payload of submission data';
