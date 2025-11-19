/**
 * Submit Page - Database-First Community Submissions
 * All stats/recent/contributors from data layer with edge caching.
 */

import dynamic from 'next/dynamic';
import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { SubmitFormClient } from '@/src/components/core/forms/content-submission-form';
import { SidebarActivityCard } from '@/src/components/core/forms/sidebar-activity-card';
import { SubmitPageHero } from '@/src/components/core/forms/submit-page-hero';
import { getSubmissionDashboard } from '@/src/lib/data/account/submissions';
import { getContentTemplates } from '@/src/lib/data/content/templates';
import { getSubmissionFormFields } from '@/src/lib/data/forms/submission-form-fields';

const NewsletterCTAVariant = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { TrendingUp } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

const SUBMISSION_TIPS = [
  'Be specific in your descriptions - help users understand what your config does',
  'Add examples in your prompts - they make configs more useful',
  'Test thoroughly before submitting - we review for quality',
  'Use clear names - avoid abbreviations and jargon',
  'Tag appropriately - tags help users discover your work',
];

const TYPE_LABELS: Partial<Record<Database['public']['Enums']['content_category'], string>> = {
  agents: 'Agent',
  mcp: 'MCP',
  rules: 'Rule',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
  skills: 'Skill',
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

import type { Metadata } from 'next';

export const metadata: Promise<Metadata> = generatePageMetadata('/submit');

/**
 * Edge-cached data: Dashboard data fetched from edge-cached data layer
 */
export const revalidate = false;

export default async function SubmitPage() {
  // Fetch all data via data layer (edge-cached)
  let dashboardData: Awaited<ReturnType<typeof getSubmissionDashboard>> | null = null;
  try {
    dashboardData = await getSubmissionDashboard(5, 5);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submission dashboard');
    logger.error('SubmitPage: getSubmissionDashboard failed', normalized, {
      recentCount: 5,
      statsCount: 5,
    });
    throw normalized;
  }

  if (!dashboardData) {
    logger.warn('SubmitPage: getSubmissionDashboard returned no data', {
      recentCount: 5,
      statsCount: 5,
    });
  }

  let formConfig: Awaited<ReturnType<typeof getSubmissionFormFields>> | null = null;
  try {
    formConfig = await getSubmissionFormFields();
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submission form config');
    logger.error('SubmitPage: getSubmissionFormFields failed', normalized);
    throw normalized;
  }

  if (!formConfig) {
    logger.error('SubmitPage: submission form config is undefined');
    throw new Error('Submission form configuration is unavailable');
  }

  let templates: Awaited<ReturnType<typeof getContentTemplates>> | null = null;
  try {
    templates = await getContentTemplates('agents');
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submission templates');
    logger.error('SubmitPage: getContentTemplates failed', normalized, {
      category: 'agents',
    });
    throw normalized;
  }

  if (!templates || templates.length === 0) {
    logger.warn('SubmitPage: no templates returned from getContentTemplates', {
      category: 'agents',
    });
  }

  const stats = {
    total: dashboardData?.stats?.total ?? 0,
    pending: dashboardData?.stats?.pending ?? 0,
    merged_this_week: dashboardData?.stats?.merged_this_week ?? 0,
  };
  const recentMerged = (dashboardData?.recent || [])
    .filter(
      (
        submission
      ): submission is NonNullable<typeof submission> & {
        id: string;
        content_name: string;
        content_type: NonNullable<typeof submission.content_type>;
        merged_at: string;
      } =>
        submission !== null &&
        submission.id !== null &&
        submission.content_name !== null &&
        submission.content_type !== null &&
        submission.merged_at !== null
    )
    .map((submission) => ({
      id: submission.id,
      content_name: submission.content_name,
      content_type: submission.content_type as Database['public']['Enums']['content_category'],
      merged_at: submission.merged_at,
      merged_at_formatted: formatTimeAgo(submission.merged_at),
      user:
        submission.user?.name && submission.user?.slug
          ? { name: submission.user.name, slug: submission.user.slug }
          : null,
    }));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Hero Header with animations */}
      <SubmitPageHero stats={stats} />

      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
        <div className="w-full min-w-0">
          <SubmitFormClient formConfig={formConfig} templates={templates} />
        </div>

        <aside className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Job Promo Card - Priority #1 */}
          <JobsPromo />

          {/* Stats Card - 3-column grid */}
          <Card>
            <CardHeader>
              <CardTitle className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2, 'font-medium text-sm')}>
                <TrendingUp className={UI_CLASSES.ICON_SM} />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent className={UI_CLASSES.GRID_COLS_3_GAP_2}>
              {/* Total */}
              <div className={cn('rounded-lg p-3 text-center', 'bg-blue-500/10')}>
                <div className={'font-bold text-2xl text-blue-400'}>{stats.total}</div>
                <div className={UI_CLASSES.TEXT_XS_MUTED}>Total</div>
              </div>

              {/* Pending */}
              <div className={cn('rounded-lg p-3 text-center', 'bg-yellow-500/10')}>
                <div className={'font-bold text-2xl text-yellow-400'}>{stats.pending}</div>
                <div className={UI_CLASSES.TEXT_XS_MUTED}>Pending</div>
              </div>

              {/* This Week */}
              <div className={cn('rounded-lg p-3 text-center', 'bg-green-500/10')}>
                <div className={'font-bold text-2xl text-green-400'}>{stats.merged_this_week}</div>
                <div className={UI_CLASSES.TEXT_XS_MUTED}>This Week</div>
              </div>
            </CardContent>
          </Card>

          {/* Combined Recent + Tips Tabbed Card */}
          <SidebarActivityCard
            recentMerged={recentMerged}
            tips={SUBMISSION_TIPS}
            typeLabels={TYPE_LABELS}
          />
        </aside>
      </div>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}
