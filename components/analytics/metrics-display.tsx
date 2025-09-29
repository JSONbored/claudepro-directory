'use client';

/**
 * MetricsDisplay - Lightweight KPI metrics visualization
 * Native implementation optimized for performance - no external dependencies
 * Used in 2 MDX files across the codebase - Specialized component for business metrics
 */

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { type MetricsDisplayProps, metricsDisplayPropsSchema } from '@/lib/schemas/shared.schema';

// Lightweight badge component for trend indicators
function BadgeDelta({
  deltaType,
  children,
}: {
  deltaType: 'increase' | 'decrease' | 'unchanged';
  children?: React.ReactNode;
}) {
  const config = {
    increase: {
      className:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      icon: <ArrowUp className="w-3 h-3" />,
    },
    decrease: {
      className:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      icon: <ArrowDown className="w-3 h-3" />,
    },
    unchanged: {
      className:
        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
      icon: <Minus className="w-3 h-3" />,
    },
  };

  const { className, icon } = config[deltaType];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function MetricsDisplay(props: MetricsDisplayProps) {
  const validated = metricsDisplayPropsSchema.parse(props);
  const { title, metrics, description } = validated;
  const validMetrics = metrics;

  return (
    <section itemScope itemType="https://schema.org/Dataset" className="my-12">
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <h3 className="text-xl font-semibold mb-3 text-foreground" itemProp="name">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Native CSS Grid with responsive layout - replaces Tremor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validMetrics.map((metric, index) => {
          // Support both new and old formats
          const metricLabel = metric.label || metric.metric || `Metric ${index + 1}`;
          const metricValue = metric.value || metric.improvement || metric.after || 'N/A';
          const metricChange = metric.change || (metric.before ? `From: ${metric.before}` : '');
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
              className={`bg-gradient-to-br ${gradientClass} border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg p-6`}
            >
              {/* Label - replaces Tremor Text */}
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {metricLabel}
              </div>

              {/* Metric Value - replaces Tremor Metric */}
              <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {metricValue}
              </div>

              {/* Change indicator - replaces Tremor Flex */}
              {metricChange && (
                <div className="mt-4 flex items-center gap-2">
                  <BadgeDelta deltaType={deltaType} />
                  <span className="text-sm font-medium text-muted-foreground">{metricChange}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
