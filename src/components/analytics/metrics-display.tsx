"use client";

/**
 * MetricsDisplay - Lightweight KPI metrics visualization
 * Replaces Tremor with custom components for better performance
 */

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "@/src/lib/icons";
import {
  type MetricsDisplayProps,
  metricsDisplayPropsSchema,
} from "@/src/lib/schemas/shared.schema";
import { UI_CLASSES } from "@/src/lib/ui-constants";
import { cn } from "@/src/lib/utils";

// Lightweight Badge component for delta display
function BadgeDelta({
  deltaType,
  className,
}: {
  deltaType: "increase" | "decrease" | "unchanged";
  className?: string;
}) {
  const icon =
    deltaType === "increase" ? (
      <ArrowUpIcon className="w-3 h-3" />
    ) : deltaType === "decrease" ? (
      <ArrowDownIcon className="w-3 h-3" />
    ) : (
      <MinusIcon className="w-3 h-3" />
    );

  const colorClass =
    deltaType === "increase"
      ? "text-green-600 bg-green-100"
      : deltaType === "decrease"
        ? "text-red-600 bg-red-100"
        : "text-gray-600 bg-gray-100";

  return (
    <span
      className={cn(
        `inline-flex ${UI_CLASSES.ITEMS_CENTER} gap-1 px-2 py-0.5 ${UI_CLASSES.ROUNDED_FULL} text-xs`,
        colorClass,
        className,
      )}
    >
      {icon}
      <span>{deltaType}</span>
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
            <h3
              className={`${UI_CLASSES.TEXT_XL} ${UI_CLASSES.FONT_SEMIBOLD} mb-3 text-foreground`}
              itemProp="name"
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className={`text-muted-foreground ${UI_CLASSES.TEXT_LG} max-w-3xl mx-auto`}
              itemProp="description"
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Grid layout - responsive columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validMetrics.map((metric, index) => {
          // Support both new and old formats
          const metricLabel =
            metric.label || metric.metric || `Metric ${index + 1}`;
          const metricValue =
            metric.value || metric.improvement || metric.after || "N/A";
          const metricChange =
            metric.change || (metric.before ? `From: ${metric.before}` : "");
          const deltaType =
            metric.trend === "up"
              ? "increase"
              : metric.trend === "down"
                ? "decrease"
                : "unchanged";

          // Choose gradient based on trend
          const gradientClass =
            metric.trend === "up"
              ? "from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40"
              : metric.trend === "down"
                ? "from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40"
                : "from-gray-500/10 to-slate-500/10 border-gray-500/20 hover:border-gray-500/40";

          return (
            <div
              key={`${metricLabel}-${metricValue}`}
              className={cn(
                `${UI_CLASSES.ROUNDED_LG} p-6 bg-gradient-to-br border backdrop-blur-sm transition-all duration-300 hover:${UI_CLASSES.SCALE_105} hover:shadow-xl`,
                gradientClass,
              )}
            >
              {/* Metric Label */}
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {metricLabel}
              </p>

              {/* Metric Value */}
              <p
                className={`mt-2 text-3xl ${UI_CLASSES.FONT_BOLD} bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent`}
              >
                {metricValue}
              </p>

              {/* Change indicator */}
              {metricChange && (
                <div className={`mt-4 ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}`}>
                  <BadgeDelta
                    deltaType={deltaType}
                    className={UI_CLASSES.FONT_SEMIBOLD}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {metricChange}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
