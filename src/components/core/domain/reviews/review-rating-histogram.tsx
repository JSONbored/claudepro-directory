/**
 * Visual rating distribution histogram (Server Component)
 * Shows average rating and distribution across 1-5 stars
 */

import {
  ChartContainer,
  HorizontalBarChart,
} from '@/src/components/core/domain/charts/horizontal-bar-chart';
import type { ReviewHistogramProps } from '@/src/components/core/domain/reviews/shared/review-types';
import { StarDisplay } from '@/src/components/core/domain/reviews/shared/star-display';
import { Card } from '@/src/components/primitives/ui/card';
import { Star } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function ReviewRatingHistogram({
  distribution,
  totalReviews,
  averageRating,
}: Omit<ReviewHistogramProps, 'variant'>) {
  // Calculate chart data (no memoization needed - server components render once)
  const chartData = [5, 4, 3, 2, 1].map((stars) => {
    const count = distribution[String(stars)] || 0;
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
          <div className="font-bold text-4xl">{averageRating.toFixed(1)}</div>
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
