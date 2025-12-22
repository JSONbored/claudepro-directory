/**
 * Inngest Test Factory
 *
 * Factory for creating standardized Inngest function tests with reduced boilerplate.
 * Provides common patterns, utilities, and mock setup for consistent testing.
 *
 * @module web-runtime/inngest/utils/test-factory
 */

import { InngestTestEngine } from '@inngest/test';
import type { InngestFunction } from 'inngest';
import {
  setupInngestTestMocks,
  resetInngestTestMocks,
  type InngestTestMocks,
} from './test-mocks';

/**
 * Configuration for creating an Inngest test factory
 */
export interface InngestTestFactoryConfig {
  /** The Inngest function to test */
  function: InngestFunction<any, any, any>;
  /** Function operation name (for logging context) */
  operation: string;
  /** Function route path (for logging context) */
  route: string;
  /** Mock configuration options */
  mocks?: {
    /** Include Resend integration mocks */
    includeResend?: boolean;
    /** Include PGMQ client mocks */
    includePgmq?: boolean;
    /** Include Next.js cache mocks */
    includeCache?: boolean;
    /** Include monitoring mocks */
    includeMonitoring?: boolean;
    /** Custom environment variables */
    envVars?: Record<string, string | undefined>;
  };
}

/**
 * Factory for creating standardized Inngest function tests
 */
export class InngestTestFactory {
  private readonly function: InngestFunction<any, any, any>;
  private readonly mocks: InngestTestMocks;

  constructor(config: InngestTestFactoryConfig) {
    this.function = config.function;
    this.mocks = setupInngestTestMocks(config.operation, config.route, config.mocks ?? {});
  }

  /**
   * Get the configured mocks
   */
  getMocks(): InngestTestMocks {
    return this.mocks;
  }

  /**
   * Create a fresh InngestTestEngine instance
   * Should be called in beforeEach to avoid state caching issues
   */
  createTestEngine(): InngestTestEngine {
    return new InngestTestEngine({
      function: this.function,
    });
  }

  /**
   * Reset all mocks to clean state
   * Should be called in beforeEach
   */
  resetMocks(): void {
    resetInngestTestMocks(this.mocks);
  }

  /**
   * Create a mock event for event-triggered functions
   */
  createEvent(eventName: string, data: Record<string, unknown>): Array<{ name: string; data: Record<string, unknown> }> {
    return [{ name: eventName, data }];
  }

  /**
   * Create mock events for batch processing
   */
  createEvents(events: Array<{ name: string; data: Record<string, unknown> }>): Array<{ name: string; data: Record<string, unknown> }> {
    return events;
  }

  /**
   * Create a mock step handler for step.sleep, step.waitForEvent, etc.
   */
  createStepMock(stepId: string, handler: () => unknown | Promise<unknown>): {
    id: string;
    handler: () => unknown | Promise<unknown>;
  } {
    return {
      id: stepId,
      handler,
    };
  }

  /**
   * Create a no-op step mock (for step.sleep, step.waitForEvent that should return immediately)
   */
  createNoOpStepMock(stepId: string): {
    id: string;
    handler: () => void;
  } {
    return {
      id: stepId,
      handler: () => {
        // No-op: step completes immediately
      },
    };
  }
}

/**
 * Helper function to create a test factory with common defaults
 */
export function createInngestTestFactory(
  config: InngestTestFactoryConfig
): InngestTestFactory {
  return new InngestTestFactory(config);
}

