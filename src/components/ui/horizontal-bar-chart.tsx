/**
 * Lightweight Horizontal Bar Chart
 *
 * Custom SVG-based horizontal bar chart implementation
 * Replaces Recharts for simple bar chart use cases
 *
 * Benefits:
 * - Zero dependencies (~70KB bundle size reduction from removing Recharts)
 * - Fully accessible with ARIA labels
 * - Responsive and theme-aware
 * - Type-safe with TypeScript
 * - Optimized for performance (pure SVG, no heavy library)
 *
 * Production Standards (October 2025):
 * - Semantic SVG with proper accessibility
 * - CSS variables for theming
 * - Smooth transitions
 * - Responsive design
 *
 * @module components/ui/horizontal-bar-chart
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

export interface HorizontalBarChartDataPoint {
  /** Category label (e.g., "5 ★") */
  label: string;
  /** Numeric value */
  value: number;
  /** Optional fill color (defaults to theme color) */
  fill?: string;
  /** Optional formatted label to display (e.g., "45.2%") */
  formattedLabel?: string;
}

export interface HorizontalBarChartProps {
  /** Chart data points */
  data: HorizontalBarChartDataPoint[];
  /** Chart height in pixels */
  height?: number;
  /** Left margin for labels (px) */
  labelWidth?: number;
  /** Right margin for value labels (px) */
  valueWidth?: number;
  /** Bar color (CSS custom property or color value) */
  barColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Bar border radius */
  borderRadius?: number;
}

/**
 * Lightweight Horizontal Bar Chart Component
 *
 * Renders horizontal bar chart using pure SVG
 * Optimized replacement for Recharts BarChart with layout="vertical"
 *
 * @example
 * ```tsx
 * <HorizontalBarChart
 *   data={[
 *     { label: "5 ★", value: 45, formattedLabel: "45%" },
 *     { label: "4 ★", value: 30, formattedLabel: "30%" },
 *   ]}
 *   height={200}
 *   ariaLabel="Rating distribution"
 * />
 * ```
 */
export function HorizontalBarChart({
  data,
  height = 200,
  labelWidth = 40,
  valueWidth = 60,
  barColor = 'hsl(var(--chart-1))',
  className,
  ariaLabel = 'Horizontal bar chart',
  borderRadius = 4,
}: HorizontalBarChartProps) {
  // Calculate dimensions
  const chartPadding = 0;
  const barHeight = Math.max(20, (height - chartPadding * 2) / data.length);
  const barGap = 8;
  const effectiveBarHeight = barHeight - barGap;

  // Find maximum value for scaling
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Chart width calculation (full width minus label and value areas)
  const chartWidth = `calc(100% - ${labelWidth + valueWidth}px)`;

  return (
    <div className={cn('w-full', className)} role="img" aria-label={ariaLabel}>
      <svg width="100%" height={height} className="text-xs" style={{ overflow: 'visible' }}>
        {data.map((point, index) => {
          const yPosition = chartPadding + index * barHeight;
          const barWidthPercent = (point.value / maxValue) * 100;

          return (
            <g key={`bar-${index}-${point.label}`}>
              {/* Label (left side) */}
              <text
                x={labelWidth - 8}
                y={yPosition + effectiveBarHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
                aria-label={`${point.label}: ${point.value}`}
              >
                {point.label}
              </text>

              {/* Bar background container */}
              <rect
                x={labelWidth}
                y={yPosition}
                width={chartWidth}
                height={effectiveBarHeight}
                fill="hsl(var(--muted))"
                opacity={0.1}
                rx={borderRadius}
              />

              {/* Actual bar */}
              <rect
                x={labelWidth}
                y={yPosition}
                width={`calc(${chartWidth} * ${barWidthPercent / 100})`}
                height={effectiveBarHeight}
                fill={point.fill || barColor}
                rx={borderRadius}
                className="transition-all duration-300 ease-out"
                aria-valuenow={point.value}
                aria-valuemin={0}
                aria-valuemax={maxValue}
              />

              {/* Value label (right side) */}
              {point.formattedLabel && (
                <text
                  x={`calc(100% - ${valueWidth - 8}px)`}
                  y={yPosition + effectiveBarHeight / 2}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-xs"
                >
                  {point.formattedLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Chart container with responsive wrapper
 * Provides aspect ratio and responsive behavior
 */
export interface ChartContainerProps {
  /** Chart content */
  children: ReactNode;
  /** Container height */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
}

export function ChartContainer({ children, height = '200px', className }: ChartContainerProps) {
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={cn('w-full', className)} style={{ height: heightStyle }}>
      {children}
    </div>
  );
}
