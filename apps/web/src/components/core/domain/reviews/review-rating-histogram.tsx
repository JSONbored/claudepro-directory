/**
 * Visual rating distribution histogram (Server Component)
 * Shows average rating and distribution across 1-5 stars
 */

import { Star } from '@heyclaude/web-runtime/icons';
import { type ReviewHistogramProps } from '@heyclaude/web-runtime/types/component.types';
import {
  UI_CLASSES,
  ChartContainer,
  HorizontalBarChart,
  StarDisplay,
  Card,
} from '@heyclaude/web-runtime/ui';

/**
 * Server component that renders an average rating and a horizontal bar chart showing the rating distribution.
 *
 * @param distribution - Object with counts for each rating key (e.g., `rating_5`, `rating_4`, ..., `rating_1`); may be undefined or partial.
 * @param totalReviews - Total number of reviews used to compute percentages and pluralization.
 * @param averageRating - Average rating value shown numerically and via the star display.
 * @returns A React element showing the average rating and a rating-distribution chart, or a muted placeholder when `totalReviews` is 0.
 *
 * @see StarDisplay
 * @see HorizontalBarChart
 * @see Card
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
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mb-2 justify-center`}>
            <Star className={`${UI_CLASSES.ICON_XL} text-muted-foreground/30`} aria-hidden="true" />
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
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} mb-2`}>
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
            <StarDisplay rating={averageRating} size="md" />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Chart: Rating Distribution */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Rating Distribution</h3>
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