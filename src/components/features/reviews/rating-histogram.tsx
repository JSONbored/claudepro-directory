'use client';

/**
 * Rating Histogram Component
 * Visual distribution of star ratings using shadcn charts
 *
 * Features:
 * - Horizontal bar chart showing rating distribution
 * - Clean, accessible design
 * - No fake data - shows "No reviews yet" when empty
 * - Responsive layout
 */

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';
import { Card } from '@/src/components/ui/card';
import { type ChartConfig, ChartContainer } from '@/src/components/ui/chart';
import { Star } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface RatingHistogramProps {
  /** Rating distribution (1-5 stars) */
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  /** Total review count */
  totalReviews: number;
  /** Average rating */
  averageRating: number;
}

export function RatingHistogram({
  distribution,
  totalReviews,
  averageRating,
}: RatingHistogramProps) {
  // If no reviews, show empty state
  if (totalReviews === 0) {
    return (
      <Card className={`p-6 ${UI_CLASSES.BG_MUTED_50}`}>
        <div className="text-center">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} justify-center mb-2`}>
            <Star className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
          </div>
          <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
            No reviews yet. Be the first to review!
          </p>
        </div>
      </Card>
    );
  }

  // Prepare chart data (reverse order: 5 stars first)
  const chartData = [5, 4, 3, 2, 1].map((stars) => {
    const count = distribution[stars as keyof typeof distribution];
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    return {
      rating: `${stars} ★`,
      count,
      percentage: Number(percentage.toFixed(1)),
      fill: 'hsl(var(--chart-1))', // Use theme color
    };
  });

  const chartConfig = {
    count: {
      label: 'Reviews',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  return (
    <Card className="p-6">
      {/* Header: Average Rating */}
      <div className="mb-6">
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} mb-2`}>
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={`star-${i + 1}`}
                className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/30'}`}
                aria-hidden="true"
              />
            ))}
          </div>{' '}
        </div>
        <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
          Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Chart: Rating Distribution */}
      <div>
        <h3 className={`${UI_CLASSES.TEXT_SM} font-semibold mb-3`}>Rating Distribution</h3>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 60, top: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="rating"
              tickLine={false}
              axisLine={false}
              width={40}
              className="text-xs"
            />
            <Bar dataKey="count" radius={4}>
              <LabelList
                dataKey="percentage"
                position="right"
                formatter={(value: React.ReactNode) => `${value}%`}
                className="text-xs fill-muted-foreground"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </Card>
  );
}
