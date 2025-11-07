/**
 * Submit Page - Database-First Community Submissions
 * All stats/recent/contributors from Supabase server actions.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { SubmitFormClient } from '@/src/components/forms/submit-form-client';
import { getSubmissionFormConfig } from '@/src/lib/forms/submission-form-config';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { CheckCircle, Clock, Lightbulb, Medal, TrendingUp, Trophy } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
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
 * ISR Configuration: Marketing pages update infrequently
 * revalidate: 86400 = Revalidate every 24 hours
 */
export const revalidate = false;

export default async function SubmitPage() {
  const supabase = await createClient();

  let data: unknown;
  let error: unknown;

  if (typeof supabase.rpc === 'function') {
    ({ data, error } = await supabase.rpc('get_submission_dashboard', {
      p_recent_limit: 5,
      p_contributors_limit: 5,
    }));
  } else {
    logger.warn(
      'Supabase RPC unavailable (mock client fallback detected); using empty submission dashboard data.'
    );
  }

  if (error) {
    logger.error(
      'Failed to fetch submission dashboard',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  const result = data as {
    stats: { total: number; pending: number; merged_this_week: number };
    recent: Array<{
      id: string | number;
      content_name: string;
      content_type: string;
      merged_at: string;
      user?: { name: string; slug: string } | null;
    }>;
    contributors: Array<{
      name: string;
      slug: string;
      rank: number;
      mergedCount: number;
    }>;
  };

  const stats = result?.stats || { total: 0, pending: 0, merged_this_week: 0 };
  const recentMerged = (result?.recent || []) as Array<{
    id: string | number;
    content_name: string;
    content_type: Database['public']['Enums']['submission_type'];
    merged_at: string;
    user?: { name: string; slug: string } | null;
  }>;
  const topContributors = (result?.contributors || []) as Array<{
    name: string;
    slug: string;
    rank: number;
    mergedCount: number;
  }>;

  const formConfig = await getSubmissionFormConfig();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Header - Responsive text sizes */}
      <div className={'mb-6 text-center sm:mb-8 lg:mb-12'}>
        <h1 className="mb-3 font-bold text-3xl sm:mb-4 sm:text-4xl lg:text-5xl">
          Submit Your Configuration
        </h1>
        <p className={'mx-auto max-w-3xl px-2 text-base text-muted-foreground sm:px-4 sm:text-lg'}>
          Share your Claude configurations with the community - no JSON formatting required!
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="w-full min-w-0">
          <SubmitFormClient formConfig={formConfig} />
        </div>

        <aside className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className={'font-medium text-sm'}>📊 Live Stats</CardTitle>
            </CardHeader>
            <CardContent className={'space-y-3'}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className={'text-muted-foreground text-sm'}>Total Configs</span>
                </div>
                <span className={'font-semibold text-lg'}>{stats.total}</span>
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className={'text-muted-foreground text-sm'}>Pending Review</span>
                </div>
                <span className={'font-semibold text-lg text-yellow-400'}>{stats.pending}</span>
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className={'text-muted-foreground text-sm'}>Merged This Week</span>
                </div>
                <span className={'font-semibold text-green-400 text-lg'}>
                  {stats.merged_this_week}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Submissions Card */}
          {recentMerged.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className={'font-medium text-sm'}>🔥 Recently Merged</CardTitle>
              </CardHeader>
              <CardContent className={'space-y-3'}>
                {recentMerged.map((submission) => (
                  <div
                    key={submission.id}
                    className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_2} border-border/50 border-b pb-3 last:border-0 last:pb-0`}
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                    <div className="min-w-0 flex-1">
                      <p className={'truncate font-medium text-sm'}>{submission.content_name}</p>
                      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mt-1 flex-wrap`}>
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          {TYPE_LABELS[submission.content_type]}
                        </UnifiedBadge>
                        {submission.user && (
                          <span className={'text-muted-foreground text-xs'}>
                            by{' '}
                            <Link
                              href={`/u/${submission.user.slug}`}
                              className="transition-colors hover:text-foreground"
                            >
                              @{submission.user.name}
                            </Link>
                          </span>
                        )}
                      </div>
                      <p className={'mt-1 text-muted-foreground text-xs'}>
                        {formatTimeAgo(submission.merged_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top Contributors Card */}
          {topContributors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className={'font-medium text-sm'}>🌟 Top Contributors</CardTitle>
              </CardHeader>
              <CardContent className={'space-y-2'}>
                {topContributors.map((contributor) => {
                  const getMedalIcon = (rank: number) => {
                    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
                    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
                    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
                    return null;
                  };

                  return (
                    <Link
                      key={contributor.slug}
                      href={`/u/${contributor.slug}`}
                      className={
                        '-mx-2 flex items-center justify-between rounded px-2 py-2 transition-colors hover:bg-accent/5'
                      }
                    >
                      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} min-w-0 flex-1`}>
                        <span
                          className={'w-4 flex-shrink-0 font-medium text-muted-foreground text-sm'}
                        >
                          {contributor.rank}.
                        </span>
                        {getMedalIcon(contributor.rank)}
                        <span className={'truncate text-sm'}>@{contributor.name}</span>
                      </div>
                      <span className={'ml-2 flex-shrink-0 font-semibold text-green-400 text-sm'}>
                        {contributor.mergedCount}
                      </span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className={'flex items-center gap-2 font-medium text-sm'}>
                <Lightbulb className="h-4 w-4 text-blue-400" />💡 Tips for Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className={'list-none space-y-2'}>
                {SUBMISSION_TIPS.map((tip) => (
                  <li key={tip} className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <span className="mt-0.5 text-blue-400 text-xs">•</span>
                    <span className={'text-muted-foreground text-xs'}>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture source="content_page" variant="hero" context="submit-page" />
      </section>
    </div>
  );
}
