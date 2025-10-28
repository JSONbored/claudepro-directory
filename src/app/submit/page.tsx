import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { SubmitFormClient } from '@/src/components/forms/submit-form-client';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import {
  getRecentMerged,
  getSubmissionStats,
  getTopContributors,
} from '@/src/lib/actions/business.actions';
import { CheckCircle, Clock, Lightbulb, Medal, TrendingUp, Trophy } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { batchFetch } from '@/src/lib/utils/batch.utils';
import type { Database } from '@/src/types/database.types';

const SUBMISSION_TIPS = [
  'Be specific in your descriptions - help users understand what your config does',
  'Add examples in your prompts - they make configs more useful',
  'Test thoroughly before submitting - we review for quality',
  'Use clear names - avoid abbreviations and jargon',
  'Tag appropriately - tags help users discover your work',
];

const TYPE_LABELS: Record<string, string> = {
  agents: 'Agent',
  mcp: 'MCP',
  rules: 'Rule',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
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

// SEO Metadata - SHA-2961
export const metadata = generatePageMetadata('/submit');

/**
 * Submit Page - Server Component
 * Fetches sidebar data in parallel on server for performance
 *
 * RESPONSIVE DESIGN:
 * - Desktop (≥1024px): Two-column layout (form + sticky sidebar)
 * - Tablet (768-1023px): Single column, sidebar below form
 * - Mobile (<768px): Single column, sidebar below form, optimized spacing
 *
 * PERFORMANCE:
 * - Server-side data fetching (parallel queries)
 * - Edge caching (5-10 min TTL)
 * - Minimal client-side JavaScript
 */
export default async function SubmitPage() {
  // Fetch sidebar data in parallel (cached for 5-10 min)
  const [statsResult, recentResult, contributorsResult] = await batchFetch([
    getSubmissionStats({}),
    getRecentMerged({ limit: 5 }),
    getTopContributors({ limit: 5 }),
  ]);

  const stats = statsResult?.data || { total: 0, pending: 0, mergedThisWeek: 0 };
  const recentMerged = recentResult?.data || [];
  const topContributors = contributorsResult?.data || [];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
      {/* Header - Responsive text sizes */}
      <div className={'text-center mb-6 sm:mb-8 lg:mb-12'}>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
          Submit Your Configuration
        </h1>
        <p className={'text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2 sm:px-4'}>
          Share your Claude configurations with the community - no JSON formatting required!
        </p>
      </div>

      {/* Two-column layout: Form + Sidebar */}
      {/* 
        BREAKPOINTS:
        - Mobile (<1024px): Single column, form first, sidebar second
        - Desktop (≥1024px): Two columns, form left (flexible), sidebar right (380px fixed), sticky sidebar
      */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Form (appears first on all screen sizes) */}
        <div className="w-full min-w-0">
          <SubmitFormClient />
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        {/* 
          RESPONSIVE BEHAVIOR:
          - Mobile/Tablet: Appears below form, full width
          - Desktop: Sticky sidebar at top-24, fixed width 380px
        */}
        <aside className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className={'text-sm font-medium'}>📊 Live Stats</CardTitle>
            </CardHeader>
            <CardContent className={'space-y-3'}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className={'text-sm text-muted-foreground'}>Total Configs</span>
                </div>
                <span className={'text-lg font-semibold'}>{stats.total}</span>
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className={'text-sm text-muted-foreground'}>Pending Review</span>
                </div>
                <span className={'text-lg font-semibold text-yellow-400'}>{stats.pending}</span>
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className={'text-sm text-muted-foreground'}>Merged This Week</span>
                </div>
                <span className={'text-lg font-semibold text-green-400'}>
                  {stats.mergedThisWeek}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Submissions Card */}
          {recentMerged.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className={'text-sm font-medium'}>🔥 Recently Merged</CardTitle>
              </CardHeader>
              <CardContent className={'space-y-3'}>
                {recentMerged.map((submission) => (
                  <div
                    key={submission.id}
                    className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_2} pb-3 border-b border-border/50 last:border-0 last:pb-0`}
                  >
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={'text-sm font-medium truncate'}>{submission.content_name}</p>
                      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mt-1 flex-wrap`}>
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          {TYPE_LABELS[submission.content_type]}
                        </UnifiedBadge>
                        {submission.user && (
                          <span className={'text-xs text-muted-foreground'}>
                            by{' '}
                            <Link
                              href={`/u/${submission.user.slug}`}
                              className="hover:text-foreground transition-colors"
                            >
                              @{submission.user.name}
                            </Link>
                          </span>
                        )}
                      </div>
                      <p className={'text-xs text-muted-foreground mt-1'}>
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
                <CardTitle className={'text-sm font-medium'}>🌟 Top Contributors</CardTitle>
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
                        'flex items-center justify-between py-2 hover:bg-accent/5 px-2 -mx-2 rounded transition-colors'
                      }
                    >
                      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} min-w-0 flex-1`}>
                        <span
                          className={'text-sm font-medium text-muted-foreground w-4 flex-shrink-0'}
                        >
                          {contributor.rank}.
                        </span>
                        {getMedalIcon(contributor.rank)}
                        <span className={'text-sm truncate'}>@{contributor.name}</span>
                      </div>
                      <span className={'text-sm font-semibold text-green-400 flex-shrink-0 ml-2'}>
                        {contributor.mergedCount}
                      </span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className={'text-sm font-medium flex items-center gap-2'}>
                <Lightbulb className="h-4 w-4 text-blue-400" />💡 Tips for Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className={'space-y-2 list-none'}>
                {SUBMISSION_TIPS.map((tip) => (
                  <li key={tip} className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <span className="text-blue-400 text-xs mt-0.5">•</span>
                    <span className={'text-xs text-muted-foreground'}>{tip}</span>
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
