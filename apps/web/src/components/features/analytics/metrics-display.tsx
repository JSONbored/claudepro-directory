/**
 * MetricsDisplay - Lightweight KPI metrics visualization (Server Component)
 * Replaces Tremor with custom components for better performance
 */

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@heyclaude/web-runtime/icons';
import { type MetricsDisplayProps } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { iconSize, cluster, grid, size, weight, tracking, marginY, marginBottom, marginTop } from "@heyclaude/web-runtime/design-system";

// Lightweight Badge component for delta display
function BadgeDelta({
  deltaType,
  className,
}: {
  className?: string;
  deltaType: 'decrease' | 'increase' | 'unchanged';
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
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
        colorClass,
        className
      )}
    >
      {icon}
      <span>{deltaType}</span>
    </span>
  );
}

export function MetricsDisplay(props: MetricsDisplayProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, metrics, description } = props;
  const validMetrics = metrics;

  return (
    <section itemScope itemType="https://schema.org/Dataset" className={`${marginY.default}`}>
      {title || description ? (
        <div className={`${marginBottom.relaxed} text-center`}>
          {title ? (
            <h3 className={`text-foreground ${marginBottom.default} ${size.xl} ${weight.semibold}`} itemProp="name">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className={`text-muted-foreground mx-auto max-w-3xl ${size.lg}`} itemProp="description">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Grid layout - responsive columns */}
      <div className={`grid gap-6 ${grid.cols1} md:${grid.cols2} lg:${grid.cols3}`}>
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
                'rounded-lg border bg-linear-to-br p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl',
                gradientClass
              )}
            >
              {/* Metric Label */}
              <p className={`text-muted-foreground ${size.sm} ${weight.medium} ${tracking.wide} uppercase`}>
                {metricLabel}
              </p>

              {/* Metric Value */}
              <p className={`from-foreground to-muted-foreground ${marginTop.compact} bg-linear-to-r bg-clip-text ${size['3xl']} ${weight.bold} text-transparent`}>
                {metricValue}
              </p>

              {/* Change indicator */}
              {metricChange ? (
                <div className={`${marginTop.default} ${cluster.compact}`}>
                  <BadgeDelta deltaType={deltaType} className={`${weight.semibold}`} />
                  <span className={`text-muted-foreground ${size.sm} ${weight.medium}`}>{metricChange}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
