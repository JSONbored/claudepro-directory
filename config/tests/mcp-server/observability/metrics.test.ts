/**
 * Tests for Metrics and Observability
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  recordToolCall,
  getToolMetrics,
  getAllToolMetrics,
  getRecentMetrics,
  clearMetrics,
  withMetrics,
  type ToolMetrics,
} from '@heyclaude/mcp-server/observability/metrics';
import { createMockLogger } from '../fixtures/test-utils.js';

describe('Metrics and Observability', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('recordToolCall', () => {
    it('should record tool call metrics', () => {
      const logger = createMockLogger();
      recordToolCall('testTool', true, 100, logger);

      const metrics = getToolMetrics('testTool');
      expect(metrics).toBeDefined();
      expect(metrics?.toolName).toBe('testTool');
      expect(metrics?.totalCalls).toBe(1);
      expect(metrics?.successCount).toBe(1);
      expect(metrics?.failureCount).toBe(0);
    });

    it('should record failed tool calls', () => {
      recordToolCall('testTool', false, 200);

      const metrics = getToolMetrics('testTool');
      expect(metrics?.failureCount).toBe(1);
      expect(metrics?.successCount).toBe(0);
    });

    it('should track duration statistics', () => {
      recordToolCall('testTool', true, 100);
      recordToolCall('testTool', true, 200);
      recordToolCall('testTool', true, 150);

      const metrics = getToolMetrics('testTool');
      expect(metrics?.minDuration).toBe(100);
      expect(metrics?.maxDuration).toBe(200);
      expect(metrics?.avgDuration).toBe(150);
      expect(metrics?.totalDuration).toBe(450);
    });

    it('should log slow operations', () => {
      const logger = createMockLogger();
      recordToolCall('slowTool', true, 2000, logger); // 2 seconds

      expect(logger.warn).toHaveBeenCalled();
      const warnCall = (logger.warn as ReturnType<typeof jest.fn>).mock.calls[0];
      expect(warnCall[0]).toContain('slow');
      expect(warnCall[1]).toHaveProperty('duration_ms', 2000);
    });

    it('should not log fast operations', () => {
      const logger = createMockLogger();
      recordToolCall('fastTool', true, 500, logger); // 500ms

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('getToolMetrics', () => {
    it('should return undefined for non-existent tool', () => {
      const metrics = getToolMetrics('nonExistentTool');
      expect(metrics).toBeUndefined();
    });

    it('should calculate error rate', () => {
      recordToolCall('testTool', true, 100);
      recordToolCall('testTool', true, 100);
      recordToolCall('testTool', false, 100);

      const metrics = getToolMetrics('testTool');
      expect(metrics?.errorRate).toBeCloseTo(1 / 3, 2);
    });
  });

  describe('getAllToolMetrics', () => {
    it('should return all tool metrics', () => {
      recordToolCall('tool1', true, 100);
      recordToolCall('tool2', true, 200);

      const allMetrics = getAllToolMetrics();
      expect(allMetrics).toHaveLength(2);
      expect(allMetrics.some((m) => m.toolName === 'tool1')).toBe(true);
      expect(allMetrics.some((m) => m.toolName === 'tool2')).toBe(true);
    });

    it('should return empty array when no metrics', () => {
      const allMetrics = getAllToolMetrics();
      expect(allMetrics).toHaveLength(0);
    });
  });

  describe('getRecentMetrics', () => {
    it('should return recent metrics', () => {
      recordToolCall('tool1', true, 100);
      recordToolCall('tool2', true, 200);

      const recent = getRecentMetrics(10);
      expect(recent.length).toBeGreaterThan(0);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 50; i++) {
        recordToolCall(`tool${i}`, true, 100);
      }

      const recent = getRecentMetrics(10);
      expect(recent.length).toBeLessThanOrEqual(10);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      recordToolCall('tool1', true, 100);
      recordToolCall('tool2', true, 200);

      expect(getAllToolMetrics().length).toBeGreaterThan(0);

      clearMetrics();

      expect(getAllToolMetrics().length).toBe(0);
      expect(getToolMetrics('tool1')).toBeUndefined();
    });
  });

  describe('withMetrics', () => {
    it('should wrap handler and track metrics', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'success' });
      const wrapped = withMetrics('testTool', handler);

      const result = await wrapped({ input: 'test' }, {}) as any;

      expect(handler).toHaveBeenCalled();
      expect(result.result).toBe('success');
      expect(result._meta).toBeDefined();
      expect(result._meta._performance).toBeDefined();

      const metrics = getToolMetrics('testTool');
      expect(metrics?.totalCalls).toBe(1);
      expect(metrics?.successCount).toBe(1);
    });

    it('should track failed calls', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrapped = withMetrics('failingTool', handler);

      await expect(wrapped({ input: 'test' }, {})).rejects.toThrow('Test error');

      const metrics = getToolMetrics('failingTool');
      expect(metrics?.totalCalls).toBe(1);
      expect(metrics?.failureCount).toBe(1);
      expect(metrics?.successCount).toBe(0);
    });

    it('should add performance metrics to response', async () => {
      // Add a small delay to ensure executionTime > 0
      const handler = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: 'test' };
      });
      const wrapped = withMetrics('testTool', handler);

      const result = await wrapped({ input: 'test' }, {}) as any;

      expect(result._meta).toBeDefined();
      expect(result._meta._performance).toBeDefined();
      expect(result._meta._performance.executionTime).toBeGreaterThan(0);
      expect(result._meta._performance.executionTime).toBeLessThan(100); // Should be fast
    });

    it('should detect cache usage from result', async () => {
      const handler = jest.fn().mockResolvedValue({ data: 'test', fromCache: true });
      const wrapped = withMetrics('cachedTool', handler);

      const result = await wrapped({ input: 'test' }, {}) as any;

      expect(result._meta._performance.cached).toBe(true);
      expect(result._meta._performance.cacheHit).toBe(true);
    });
  });
});

