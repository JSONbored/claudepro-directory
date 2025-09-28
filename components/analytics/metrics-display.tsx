'use client';

/**
 * MetricsDisplay - KPI metrics visualization using Tremor
 * Used in 2 MDX files across the codebase - Specialized component for business metrics
 */

import dynamic from 'next/dynamic';
import { type MetricsDisplayProps, metricsDisplayPropsSchema } from '@/lib/schemas/shared.schema';

// Dynamic imports for Tremor components to reduce bundle size
// These are only loaded when MetricsDisplay component is used
const BadgeDelta = dynamic(
  () => import('@tremor/react').then((mod) => ({ default: mod.BadgeDelta })),
  { ssr: false }
);
const Flex = dynamic(() => import('@tremor/react').then((mod) => ({ default: mod.Flex })), {
  ssr: false,
});
const Grid = dynamic(() => import('@tremor/react').then((mod) => ({ default: mod.Grid })), {
  ssr: false,
});
const Metric = dynamic(() => import('@tremor/react').then((mod) => ({ default: mod.Metric })), {
  ssr: false,
});
const Text = dynamic(() => import('@tremor/react').then((mod) => ({ default: mod.Text })), {
  ssr: false,
});
const TremorCard = dynamic(() => import('@tremor/react').then((mod) => ({ default: mod.Card })), {
  ssr: false,
});

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

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
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
            <TremorCard
              key={`${metricLabel}-${metricValue}`}
              className={`bg-gradient-to-br ${gradientClass} border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {metricLabel}
              </Text>
              <Metric className="mt-2 text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {metricValue}
              </Metric>
              {metricChange && (
                <Flex className="mt-4 items-center">
                  <BadgeDelta deltaType={deltaType} className="font-semibold" />
                  <Text className="ml-2 text-sm font-medium">{metricChange}</Text>
                </Flex>
              )}
            </TremorCard>
          );
        })}
      </Grid>
    </section>
  );
}
