/**
 * Reputation Breakdown Component
 *
 * Displays user reputation score with detailed breakdown by activity type.
 * Shows current tier, progress to next tier, and point distribution.
 *
 * Production Standards:
 * - Configuration-driven using reputation.config.ts
 * - Type-safe with Zod schemas
 * - Performance-optimized with React.memo
 * - Accessible with ARIA labels
 * - Responsive design
 * - Theme-aware styling
 *
 * @module components/features/reputation/reputation-breakdown
 */

'use client';

import { FileText, MessageSquare, Star, ThumbsUp, TrendingUp, Trophy } from 'lucide-react';
import { memo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { HorizontalBarChart } from '@/src/components/ui/horizontal-bar-chart';
import { UnifiedBadge } from '@/src/components/ui/unified-badge';
import {
  getNextTier,
  getReputationTier,
  getTierProgress,
  REPUTATION_POINTS,
  type ReputationBreakdown as ReputationBreakdownType,
} from '@/src/lib/config/reputation.config';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface ReputationBreakdownProps {
  /** Reputation breakdown data */
  breakdown: ReputationBreakdownType;
  /** Show detailed breakdown chart */
  showDetails?: boolean;
  /** Show next tier progress */
  showProgress?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// TIER BADGE COLORS
// =============================================================================

const TIER_COLORS: Record<string, string> = {
  Newcomer: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
  Contributor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  Regular: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  Expert: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  Master: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
  Legend: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20',
} as const;

// =============================================================================
// ACTIVITY ICONS
// =============================================================================

const ACTIVITY_ICONS = {
  posts: FileText,
  votes_received: ThumbsUp,
  comments: MessageSquare,
  submissions: Star,
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Reputation Breakdown Component
 *
 * Displays comprehensive reputation information:
 * - Total reputation score with tier badge
 * - Current tier icon and progress
 * - Breakdown by activity type (posts, votes, comments, submissions)
 * - Progress bar to next tier
 *
 * @example
 * ```tsx
 * <ReputationBreakdown
 *   breakdown={{
 *     from_posts: 100,
 *     from_votes_received: 50,
 *     from_comments: 20,
 *     from_submissions: 80,
 *     total: 250
 *   }}
 *   showDetails={true}
 *   showProgress={true}
 * />
 * ```
 */
export const ReputationBreakdown = memo(function ReputationBreakdown({
  breakdown,
  showDetails = true,
  showProgress = true,
  className,
}: ReputationBreakdownProps) {
  const currentTier = getReputationTier(breakdown.total);
  const nextTier = getNextTier(breakdown.total);
  const progress = getTierProgress(breakdown.total);

  // Prepare chart data for breakdown visualization
  const chartData = [
    {
      label: 'Posts',
      value: breakdown.from_posts,
      formattedLabel: `${breakdown.from_posts} pts`,
      fill: 'hsl(var(--chart-1))',
    },
    {
      label: 'Votes',
      value: breakdown.from_votes_received,
      formattedLabel: `${breakdown.from_votes_received} pts`,
      fill: 'hsl(var(--chart-2))',
    },
    {
      label: 'Comments',
      value: breakdown.from_comments,
      formattedLabel: `${breakdown.from_comments} pts`,
      fill: 'hsl(var(--chart-3))',
    },
    {
      label: 'Submissions',
      value: breakdown.from_submissions,
      formattedLabel: `${breakdown.from_submissions} pts`,
      fill: 'hsl(var(--chart-4))',
    },
  ];

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <div className="space-y-1">
            <CardTitle as="h3" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Trophy className="h-5 w-5 text-primary" />
              Reputation
            </CardTitle>
            <CardDescription>Community contribution score</CardDescription>
          </div>
          <UnifiedBadge
            variant="base"
            style="secondary"
            className={cn(
              'text-base font-bold px-3 py-1',
              TIER_COLORS[currentTier.name] || TIER_COLORS.Newcomer
            )}
          >
            {breakdown.total}
          </UnifiedBadge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Tier */}
        <div className="space-y-2">
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <span className={UI_CLASSES.TEXT_SM_MUTED}>Current Tier</span>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={cn('gap-1.5', TIER_COLORS[currentTier.name] || TIER_COLORS.Newcomer)}
            >
              <span className="text-base">{currentTier.icon}</span>
              {currentTier.name}
            </UnifiedBadge>
          </div>
          <p className="text-xs text-muted-foreground">{currentTier.description}</p>
        </div>

        {/* Progress to Next Tier */}
        {showProgress && nextTier && (
          <div className="space-y-2">
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={UI_CLASSES.TEXT_SM_MUTED}>Progress to {nextTier.tier.name}</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progress}% progress to ${nextTier.tier.name}`}
              />
            </div>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {nextTier.pointsNeeded} points needed for {nextTier.tier.icon} {nextTier.tier.name}
              </p>
            </div>
          </div>
        )}

        {/* Detailed Breakdown */}
        {showDetails && breakdown.total > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Reputation Breakdown</h4>

            {/* Breakdown Chart */}
            <HorizontalBarChart
              data={chartData}
              height={160}
              ariaLabel="Reputation breakdown by activity type"
              labelWidth={80}
              valueWidth={60}
            />

            {/* Activity Details Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Object.entries({
                posts: { label: 'Posts', value: breakdown.from_posts, icon: ACTIVITY_ICONS.posts },
                votes_received: {
                  label: 'Votes Received',
                  value: breakdown.from_votes_received,
                  icon: ACTIVITY_ICONS.votes_received,
                },
                comments: {
                  label: 'Comments',
                  value: breakdown.from_comments,
                  icon: ACTIVITY_ICONS.comments,
                },
                submissions: {
                  label: 'Submissions',
                  value: breakdown.from_submissions,
                  icon: ACTIVITY_ICONS.submissions,
                },
              }).map(([key, { label, value, icon: Icon }]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40"
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                    <p className="text-sm font-semibold">{value} pts</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Point Values Reference */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                How reputation is calculated
              </summary>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p>Points are earned for different activities:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Create a post: +{REPUTATION_POINTS.POST} points</li>
                  <li>• Receive an upvote: +{REPUTATION_POINTS.VOTE_RECEIVED} points</li>
                  <li>• Write a comment: +{REPUTATION_POINTS.COMMENT} points</li>
                  <li>• Get submission merged: +{REPUTATION_POINTS.SUBMISSION_MERGED} points</li>
                  <li>• Write a review: +{REPUTATION_POINTS.REVIEW} points</li>
                  <li>
                    • Content bookmarked by others: +{REPUTATION_POINTS.BOOKMARK_RECEIVED} points
                  </li>
                  <li>• Gain a follower: +{REPUTATION_POINTS.FOLLOWER} point</li>
                </ul>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
