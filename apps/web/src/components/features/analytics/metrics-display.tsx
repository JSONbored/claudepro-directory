/**
 * MetricsDisplay - Lightweight KPI metrics visualization (Server Component)
 * Replaces Tremor with custom components for better performance
 */

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@heyclaude/web-runtime/icons';
import { type MetricsDisplayProps } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';

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
      <ArrowUpIcon className="h-3 w-3" />
    ) : deltaType === 'decrease' ? (
      <ArrowDownIcon className="h-3 w-3" />
    ) : (
      <MinusIcon className="h-3 w-3" />
    );

  const colorClass =
    deltaType === 'increase'
      ? 'text-success bg-success-bg'
      : deltaType === 'decrease'
        ? 'text-error bg-error-bg'
        : 'text-muted-foreground bg-muted';

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
    <section itemScope itemType="https://schema.org/Dataset" className="my-4">
      {title || description ? (
        <div className="mb-8 text-center">
          {title ? (
            <h3 className="text-foreground mb-4 text-xl font-semibold" itemProp="name">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="text-muted-foreground mx-auto max-w-3xl text-lg" itemProp="description">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Grid layout - responsive columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {validMetrics.map((metric, index) => {
          const metricLabel = metric.label || `Metric ${index + 1}`;
          const metricValue = metric.value;
          const metricChange = metric.change || '';
          const deltaType =
            metric.trend === 'up' ? 'increase' : metric.trend === 'down' ? 'decrease' : 'unchanged';

          // Choose gradient based on trend - use semantic theme colors
          const gradientClass =
            metric.trend === 'up'
              ? 'bg-success-bg border-success-border hover:border-success-border/60'
              : metric.trend === 'down'
                ? 'bg-info-bg border-info-border hover:border-info-border/60'
                : 'bg-muted/50 border-border hover:border-border/60';

          return (
            <div
              key={`${metricLabel}-${metricValue}`}
              className={cn(
                'card-base bg-linear-to-br p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl',
                gradientClass
              )}
            >
              {/* Metric Label */}
              <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                {metricLabel}
              </p>

              {/* Metric Value */}
              <p className="from-foreground to-muted-foreground mt-2 bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent">
                {metricValue}
              </p>

              {/* Change indicator */}
              {metricChange ? (
                <div className="mt-4 flex items-center gap-2">
                  <BadgeDelta deltaType={deltaType} className="font-semibold" />
                  <span className="text-muted-foreground text-sm font-medium">{metricChange}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
