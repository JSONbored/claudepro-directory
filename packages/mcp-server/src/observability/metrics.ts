/**
 * Enhanced Metrics and Observability
 *
 * Provides detailed metrics tracking for MCP server operations:
 * - Tool usage statistics
 * - Performance metrics (duration, success/failure rates)
 * - Resource usage (cache hits/misses, database queries)
 * - Error tracking
 * - User activity patterns
 *
 * Metrics are collected in-memory and can be exported to:
 * - Axiom (Cloudflare Workers)
 * - Prometheus (Node.js)
 * - Custom exporters
 */

import type { RuntimeLogger } from '../types/runtime.js';

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

/**
 * Base metric interface
 */
interface BaseMetric {
  name: string;
  type: MetricType;
  labels: Record<string, string>;
  timestamp: number;
}

/**
 * Counter metric (increments)
 */
export interface CounterMetric extends BaseMetric {
  type: MetricType.COUNTER;
  value: number;
}

/**
 * Gauge metric (current value)
 */
export interface GaugeMetric extends BaseMetric {
  type: MetricType.GAUGE;
  value: number;
}

/**
 * Histogram metric (distribution)
 */
export interface HistogramMetric extends BaseMetric {
  type: MetricType.HISTOGRAM;
  value: number;
  buckets?: number[];
}

/**
 * Metric entry
 */
export type MetricEntry = CounterMetric | GaugeMetric | HistogramMetric;

/**
 * Tool usage metrics
 */
export interface ToolMetrics {
  toolName: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  lastCalledAt: number;
  errorRate: number;
}

/**
 * In-memory metrics store
 */
class MetricsStore {
  private metrics: MetricEntry[] = [];
  private toolStats = new Map<
    string,
    {
      totalCalls: number;
      successCount: number;
      failureCount: number;
      totalDuration: number;
      minDuration: number;
      maxDuration: number;
      lastCalledAt: number;
    }
  >();

  /**
   * Record a metric
   */
  record(metric: MetricEntry): void {
    this.metrics.push(metric);
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Record tool call
   */
  recordToolCall(toolName: string, success: boolean, duration: number): void {
    const stats = this.toolStats.get(toolName) || {
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      lastCalledAt: 0,
    };

    stats.totalCalls++;
    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }
    stats.totalDuration += duration;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.lastCalledAt = Date.now();

    this.toolStats.set(toolName, stats);

    // Record metric
    this.record({
      name: 'mcp_tool_call',
      type: MetricType.COUNTER,
      labels: {
        tool: toolName,
        status: success ? 'success' : 'failure',
      },
      value: 1,
      timestamp: Date.now(),
    });

    // Record duration histogram
    this.record({
      name: 'mcp_tool_duration',
      type: MetricType.HISTOGRAM,
      labels: {
        tool: toolName,
      },
      value: duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Get tool metrics
   */
  getToolMetrics(toolName: string): ToolMetrics | undefined {
    const stats = this.toolStats.get(toolName);
    if (!stats) {
      return undefined;
    }

    return {
      toolName,
      totalCalls: stats.totalCalls,
      successCount: stats.successCount,
      failureCount: stats.failureCount,
      totalDuration: stats.totalDuration,
      minDuration: stats.minDuration === Infinity ? 0 : stats.minDuration,
      maxDuration: stats.maxDuration,
      avgDuration: stats.totalCalls > 0 ? stats.totalDuration / stats.totalCalls : 0,
      lastCalledAt: stats.lastCalledAt,
      errorRate: stats.totalCalls > 0 ? stats.failureCount / stats.totalCalls : 0,
    };
  }

  /**
   * Get all tool metrics
   */
  getAllToolMetrics(): ToolMetrics[] {
    const metrics: ToolMetrics[] = [];
    for (const toolName of this.toolStats.keys()) {
      const metric = this.getToolMetrics(toolName);
      if (metric) {
        metrics.push(metric);
      }
    }
    return metrics;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): MetricEntry[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.toolStats.clear();
  }
}

// Global metrics store
const globalMetricsStore = new MetricsStore();

/**
 * Record a tool call metric
 *
 * @param toolName - Name of the tool
 * @param success - Whether the call succeeded
 * @param duration - Duration in milliseconds
 * @param logger - Logger instance (optional, for logging)
 */
export function recordToolCall(
  toolName: string,
  success: boolean,
  duration: number,
  logger?: RuntimeLogger
): void {
  globalMetricsStore.recordToolCall(toolName, success, duration);

  // Log slow operations (>1s)
  if (duration > 1000 && logger) {
    logger.warn(`Slow tool call detected: ${toolName}`, {
      tool: toolName,
      duration_ms: duration,
      slow: true,
    });
  }
}

/**
 * Performance metrics to add to tool responses
 */
export interface PerformanceMetrics {
  executionTime: number; // Duration in milliseconds
  cached?: boolean; // Whether result was served from cache
  cacheHit?: boolean; // Cache hit/miss status
}

/**
 * Check if an object has a `_meta` property
 */
function hasMeta(obj: unknown): obj is { _meta: Record<string, unknown> } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_meta' in obj &&
    typeof (obj as { _meta: unknown })._meta === 'object' &&
    (obj as { _meta: unknown })._meta !== null
  );
}

/**
 * Add performance metrics to tool response
 *
 * @param result - Tool response
 * @param metrics - Performance metrics
 * @returns Enhanced response with metrics in _meta
 */
function addPerformanceMetricsToResponse<TOutput>(
  result: TOutput,
  metrics: PerformanceMetrics
): TOutput {
  // If result has _meta, add metrics to it
  if (hasMeta(result)) {
    return {
      ...result,
      _meta: {
        ...result._meta,
        _performance: metrics,
      },
    } as TOutput;
  }

  // If result is an object, add _meta with metrics
  if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
    return {
      ...result,
      _meta: {
        _performance: metrics,
      },
    } as TOutput;
  }

  // If result is not an object, wrap it
  return {
    content: result,
    _meta: {
      _performance: metrics,
    },
  } as TOutput;
}

/**
 * Wrap a tool handler with metrics tracking and performance metadata injection
 *
 * @param toolName - Name of the tool
 * @param handler - Tool handler function
 * @param logger - Logger instance (optional)
 * @returns Wrapped handler with metrics
 */
export function withMetrics<TInput, TOutput, TContext = unknown>(
  toolName: string,
  handler: (input: TInput, context: TContext) => Promise<TOutput>,
  logger?: RuntimeLogger
): (input: TInput, context: TContext) => Promise<TOutput> {
  return async (input: TInput, context: TContext): Promise<TOutput> => {
    const startTime = Date.now();
    let success = false;
    let cached = false;
    let cacheHit = false;

    try {
      const result = await handler(input, context);
      success = true;

      // Check if result indicates cache usage (if it has fromCache property)
      if (typeof result === 'object' && result !== null && 'fromCache' in result) {
        cached = (result as { fromCache?: boolean }).fromCache ?? false;
        cacheHit = cached;
      }

      // Add performance metrics to response
      const duration = Date.now() - startTime;
      const enhancedResult = addPerformanceMetricsToResponse(result, {
        executionTime: duration,
        cached,
        cacheHit,
      });

      // Record metrics (after enhancing response)
      recordToolCall(toolName, success, duration, logger);

      return enhancedResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      recordToolCall(toolName, success, duration, logger);
      throw error;
    }
  };
}

/**
 * Get metrics for a specific tool
 *
 * @param toolName - Name of the tool
 * @returns Tool metrics or undefined if not found
 */
export function getToolMetrics(toolName: string): ToolMetrics | undefined {
  return globalMetricsStore.getToolMetrics(toolName);
}

/**
 * Get all tool metrics
 *
 * @returns Array of all tool metrics
 */
export function getAllToolMetrics(): ToolMetrics[] {
  return globalMetricsStore.getAllToolMetrics();
}

/**
 * Get recent metrics
 *
 * @param limit - Maximum number of metrics to return (default: 100)
 * @returns Array of recent metrics
 */
export function getRecentMetrics(limit: number = 100): MetricEntry[] {
  return globalMetricsStore.getRecentMetrics(limit);
}

/**
 * Clear all metrics
 * Useful for testing or manual reset
 */
export function clearMetrics(): void {
  globalMetricsStore.clear();
}
