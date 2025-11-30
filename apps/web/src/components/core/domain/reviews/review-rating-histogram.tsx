/**
 * Visual rating distribution histogram (Server Component)
 * Shows average rating and distribution across 1-5 stars
 */

import { cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import { Star } from '@heyclaude/web-runtime/icons';
import type { ReviewHistogramProps } from '@heyclaude/web-runtime/types/component.types';
import {
  ChartContainer,
  HorizontalBarChart,
  StarDisplay,
} from '@heyclaude/web-runtime/ui';
import { Card } from '@heyclaude/web-runtime/ui';

/**
 * Renders a rating histogram card that shows the average rating and a 1–5 star distribution.
 *
 * Computes the distribution chart data server-side and displays either a placeholder when there
 * are no reviews or a card with the average rating, star visualization, review count, and a
 * horizontal bar chart of ratings.
 *
 * @param distribution - Optional object with fields `rating_1` … `rating_5` containing counts for each star level
 * @param totalReviews - Total number of reviews used to compute percentage values and decide empty state
 * @param averageRating - Average rating value shown numerically and via the star display
 * @returns A React element rendering the rating histogram or an empty-state placeholder
 *
 * @see ChartContainer
 * @see HorizontalBarChart
 * @see StarDisplay
 */
export function ReviewRatingHistogram({
  distribution,
  totalReviews,
  averageRating,
}: Omit<ReviewHistogramProps, 'variant'>) {
  // Calculate chart data (no memoization needed - server components render once)
  // Map from generated type structure (rating_1, rating_2, etc.) to star counts
  const chartData = [5, 4, 3, 2, 1].map((stars) => {
    const count = distribution
      ? stars === 5
        ? (distribution['rating_5'] ?? 0)
        : stars === 4
          ? (distribution['rating_4'] ?? 0)
          : stars === 3
            ? (distribution['rating_3'] ?? 0)
            : stars === 2
              ? (distribution['rating_2'] ?? 0)
              : (distribution['rating_1'] ?? 0)
      : 0;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    return {
      label: `${stars} ★`,
      value: count,
      formattedLabel: `${percentage.toFixed(1)}%`,
      fill: 'hsl(var(--chart-1))',
    };
  });

  if (totalReviews === 0) {
    return (
      <Card className="bg-muted/50 p-6">
        <div className="text-center">
          <div className={`${cluster.compact} mb-2 justify-center`}>
            <Star className={`${iconSize.xl} text-muted-foreground/30`} aria-hidden="true" />
          </div>
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header: Average Rating */}
      <div className="mb-6">
        <div className={`${cluster.default} mb-2`}>
          <div className="font-bold text-4xl">{averageRating.toFixed(1)}</div>
          <div className={cluster.tight}>
            <StarDisplay rating={averageRating} size="md" />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Chart: Rating Distribution */}
      <div>
        <h3 className="mb-3 font-semibold text-sm">Rating Distribution</h3>
        <ChartContainer height="200px" className="w-full">
          <HorizontalBarChart
            data={chartData}
            height={200}
            labelWidth={40}
            valueWidth={60}
            barColor="hsl(var(--chart-1))"
            ariaLabel="Rating distribution chart"
            borderRadius={4}
          />
        </ChartContainer>
      </div>
    </Card>
  );
}