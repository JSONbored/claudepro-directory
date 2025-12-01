/**
 * MetricsDisplay - Lightweight KPI metrics visualization (Server Component)
 * Replaces Tremor with custom components for better performance
 */

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@heyclaude/web-runtime/icons';
import type { MetricsDisplayProps } from '@heyclaude/web-runtime/types/component.types';
import { cluster, grid, iconSize, marginBottom, muted, weight ,size    , maxWidth } from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';

/**
 * Renders a compact delta badge showing an icon and label for an increase, decrease, or unchanged state.
 *
 * @param props.deltaType - One of `'increase'`, `'decrease'`, or `'unchanged'`; determines the icon and color styling.
 * @param props.className - Optional additional CSS class names to apply to the badge container.
 * @returns A span element rendering a small rounded badge containing the chosen icon and the `deltaType` label.
 *
 * @see MetricsDisplay
 * @see iconSize
 * @see cn
 */
function BadgeDelta({
  deltaType,
  className,
}: {
  deltaType: 'increase' | 'decrease' | 'unchanged';
  className?: string;
}) {
  const icon =
    deltaType === 'increase' ? (
      <ArrowUpIcon className={iconSize.xs} />
    ) : deltaType === 'decrease' ? (
      <ArrowDownIcon className={iconSize.xs} />
    ) : (
      <MinusIcon className={iconSize.xs} />
    );

  const colorClass =
    deltaType === 'increase'
      ? 'text-green-600 bg-green-100'
      : deltaType === 'decrease'
        ? 'text-red-600 bg-red-100'
        : 'text-gray-600 bg-gray-100';

  return (
    <span
      className={cn(
        'inline-${cluster.tight} rounded-full ${padding.xTight} ${padding.yHair} ${size.xs}',
        colorClass,
        className
      )}
    >
      {icon}
      <span>{deltaType}</span>
    </span>
  );
}

/**
 * Render a responsive grid of KPI metric cards with an optional title and description.
 *
 * Renders a semantic Dataset section (schema.org) that displays each metric as a card containing a label,
 * a prominent value, and an optional change indicator rendered with BadgeDelta. Visual styling for each
 * card (gradient, border hover, and delta type) is derived from the metric's `trend`. This component
 * does not perform runtime validation of `metrics`; the input structure is expected to be validated upstream
 * (e.g., by a database CHECK constraint).
 *
 * @param props - Component props
 * @param props.title - Optional section title shown above the metrics
 * @param props.description - Optional descriptive text shown under the title
 * @param props.metrics - Array of metric objects to render. Each metric should include:
 *   - `label?: string` — optional metric label; defaults to "Metric N" when absent
 *   - `value: string | number` — primary displayed metric value
 *   - `change?: string` — optional textual change displayed next to the delta badge
 *   - `trend?: 'up' | 'down' | string` — determines visual treatment; `'up'` → increase, `'down'` → decrease, otherwise unchanged
 * @returns A section element containing the rendered metric cards and optional header content
 *
 * @see BadgeDelta
 * @see grid.responsive3
 * @see cluster.compact
 */
export function MetricsDisplay(props: MetricsDisplayProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, metrics, description } = props;
  const validMetrics = metrics;

  return (
    <section itemScope={true} itemType="https://schema.org/Dataset" className="my-12">
      {(title || description) && (
        <div className={`${marginBottom.relaxed} text-center`}>
          {title && (
            <h3 className={`mb-3 ${weight.semibold} text-foreground ${size.xl}`} itemProp="name">
              {title}
            </h3>
          )}
          {description && (
            <p className={`mx-auto ${maxWidth['3xl']} ${muted.lg}`} itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Grid layout - responsive columns */}
      <div className={grid.responsive3}>
        {validMetrics.map((metric, index) => {
          const metricLabel = metric.label || `Metric ${index + 1}`;
          const metricValue = metric.value;
          const metricChange = metric.change || '';
          const deltaType =
            metric.trend === 'up' ? 'increase' : metric.trend === 'down' ? 'decrease' : 'unchanged';

          // Choose gradient based on trend
          const gradientClass =
            metric.trend === 'up'
              ? 'from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40'
              : metric.trend === 'down'
                ? 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40'
                : 'from-gray-500/10 to-slate-500/10 border-gray-500/20 hover:border-gray-500/40';

          return (
            <div
              key={`${metricLabel}-${metricValue}`}
              className={cn(
                '${radius.lg} border bg-linear-to-br ${padding.comfortable} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl',
                gradientClass
              )}
            >
              {/* Metric Label */}
              <p className={`${weight.medium} ${muted.sm} uppercase tracking-wide`}>
                {metricLabel}
              </p>

              {/* Metric Value */}
              <p
                className={`mt-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text ${weight.bold} ${size['3xl']} text-transparent`}
              >
                {metricValue}
              </p>

              {/* Change indicator */}
              {metricChange && (
                <div className={cn('mt-4', cluster.compact)}>
                  <BadgeDelta deltaType={deltaType} className={weight.semibold} />
                  <span className={`${weight.medium} ${muted.sm}`}>{metricChange}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}