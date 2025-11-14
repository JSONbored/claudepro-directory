/**
 * Submit Page - Database-First Community Submissions
 * All stats/recent/contributors from data layer with edge caching.
 */

import dynamic from 'next/dynamic';
import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { SubmitFormClient } from '@/src/components/core/forms/content-submission-form';
import { SidebarActivityCard } from '@/src/components/core/forms/sidebar-activity-card';
import { SubmitPageHero } from '@/src/components/core/forms/submit-page-hero';
import { getSubmissionDashboard } from '@/src/lib/data/submissions';
import { getContentTemplates } from '@/src/lib/data/templates';
import { getSubmissionFormConfig } from '@/src/lib/forms/submission-form-config';

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
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import type { Database } from '@/src/types/database.types';

const SUBMISSION_TIPS = [
  'Be specific in your descriptions - help users understand what your config does',
  'Add examples in your prompts - they make configs more useful',
  'Test thoroughly before submitting - we review for quality',
  'Use clear names - avoid abbreviations and jargon',
  'Tag appropriately - tags help users discover your work',
];

const TYPE_LABELS: Record<Database['public']['Enums']['submission_type'], string> = {
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

export const metadata = generatePageMetadata('/submit');

/**
 * Static generation: Dashboard data fetched at build time
 */
export const revalidate = false;

export default async function SubmitPage() {
  // Fetch all data via data layer (edge-cached)
  const dashboardData = await getSubmissionDashboard(5, 5);
  const formConfig = await getSubmissionFormConfig();
  const templates = await getContentTemplates('agents');

  const stats = dashboardData?.stats || { total: 0, pending: 0, merged_this_week: 0 };
  const recentMerged = (dashboardData?.recent || []).map((submission) => ({
    ...submission,
    merged_at_formatted: formatTimeAgo(submission.merged_at),
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
