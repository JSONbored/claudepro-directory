/**
 * Event Bus - Event-Driven Architecture
 *
 * Centralized event emitter for decoupling services and handling side effects.
 * Enables loose coupling, async operations, and event sourcing patterns.
 *
 * Production Standards:
 * - Type-safe event definitions with Zod validation
 * - Async event handlers with error boundaries
 * - Priority-based event handlers
 * - Event middleware support
 * - Performance monitoring
 * - Automatic retry logic for failed handlers
 * - Dead letter queue for permanently failed events
 *
 * Architecture Benefits:
 * - Decouples services (no direct dependencies)
 * - Enables async side effects without blocking
 * - Supports event sourcing and audit trails
 * - Easy to add new event handlers without modifying emitters
 * - Testable (can spy on events)
 *
 * @module lib/events/event-bus
 */

import type { z } from 'zod';
import { logger } from '@/src/lib/logger';

// =====================================================
// TYPES & INTERFACES
// =====================================================

/**
 * Event handler function signature
 */
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

/**
 * Event handler options
 */
export interface EventHandlerOptions {
  /** Handler priority (higher = runs first) */
  priority?: number;
  /** Max retries on failure */
  maxRetries?: number;
  /** Retry delay in ms */
  retryDelayMs?: number;
  /** Handler name for logging */
  name?: string;
}

/**
 * Domain Event - Base type for all events
 */
export interface DomainEvent<T = unknown> {
  /** Event name (kebab-case) */
  name: string;
  /** Event payload */
  data: T;
  /** Event timestamp */
  timestamp: Date;
  /** Event ID for tracing */
  eventId: string;
  /** Correlation ID for request tracing */
  correlationId?: string | undefined;
  /** Event metadata */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Event handler registration
 */
interface HandlerRegistration<T = unknown> {
  handler: EventHandler<T>;
  options: EventHandlerOptions;
  retryCount: number;
}

/**
 * Event middleware function
 */
export type EventMiddleware = (event: DomainEvent, next: () => Promise<void>) => Promise<void>;

/**
 * Dead letter queue entry
 */
interface DeadLetterEntry {
  event: DomainEvent;
  error: Error;
  failedAt: Date;
  retries: number;
}

// =====================================================
// EVENT BUS IMPLEMENTATION
// =====================================================

/**
 * EventBus
 * Type-safe pub/sub event system for decoupling services
 */
export class EventBus {
  private handlers: Map<string, HandlerRegistration[]> = new Map();
  private middleware: EventMiddleware[] = [];
  private deadLetterQueue: DeadLetterEntry[] = [];
  private eventHistory: DomainEvent[] = [];
  private maxHistorySize = 1000;
  private enableHistory = process.env.NODE_ENV === 'development';
  private enableMonitoring = true;

  /**
   * Subscribe to an event
   */
  on<T = unknown>(
    eventName: string,
    handler: EventHandler<T>,
    options: EventHandlerOptions = {}
  ): () => void {
    const registration: HandlerRegistration<T> = {
      handler,
      options: {
        priority: 0,
        maxRetries: 3,
        retryDelayMs: 1000,
        ...options,
      },
      retryCount: 0,
    };

    const handlers = this.handlers.get(eventName) || [];
    handlers.push(registration as HandlerRegistration);

    // Sort by priority (higher first)
    handlers.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

    this.handlers.set(eventName, handlers);

    if (this.enableMonitoring) {
      logger.debug('Event handler registered', {
        eventName,
        handlerName: options.name || 'anonymous',
        priority: options.priority || 0,
      });
    }

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.handlers.get(eventName) || [];
      const filtered = currentHandlers.filter((h) => h !== registration);
      if (filtered.length === 0) {
        this.handlers.delete(eventName);
      } else {
        this.handlers.set(eventName, filtered);
      }
    };
  }

  /**
   * Subscribe to an event (alias for on)
   */
  subscribe<T = unknown>(
    eventName: string,
    handler: EventHandler<T>,
    options?: EventHandlerOptions
  ): () => void {
    return this.on(eventName, handler, options);
  }

  /**
   * Emit an event to all subscribers
   */
  async emit<T = unknown>(
    eventName: string,
    data: T,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const event: DomainEvent<T> = {
      name: eventName,
      data,
      timestamp: new Date(),
      eventId: this.generateEventId(),
      correlationId: metadata?.correlationId as string | undefined,
      metadata,
    };

    // Add to history for debugging
    if (this.enableHistory) {
      this.addToHistory(event);
    }

    const startTime = this.enableMonitoring ? performance.now() : 0;

    try {
      // Run through middleware chain
      await this.runMiddleware(event);

      // Get handlers
      const handlers = this.handlers.get(eventName) || [];

      if (handlers.length === 0) {
        if (this.enableMonitoring) {
          logger.debug('No handlers for event', { eventName });
        }
        return;
      }

      // Execute handlers in priority order
      await Promise.all(
        handlers.map((registration) =>
          this.executeHandler(event, registration as HandlerRegistration<T>)
        )
      );

      if (this.enableMonitoring) {
        const duration = performance.now() - startTime;
        logger.debug('Event emitted successfully', {
          eventName,
          handlerCount: handlers.length,
          duration: `${duration.toFixed(2)}ms`,
        });
      }
    } catch (error) {
      logger.error(
        `Failed to emit event: ${eventName}`,
        error instanceof Error ? error : new Error(String(error)),
        { eventName, eventId: event.eventId }
      );
      throw error;
    }
  }

  /**
   * Emit event without waiting (fire-and-forget)
   */
  emitAsync<T = unknown>(eventName: string, data: T, metadata?: Record<string, unknown>): void {
    this.emit(eventName, data, metadata).catch((error) => {
      logger.error(
        `Async event emission failed: ${eventName}`,
        error instanceof Error ? error : new Error(String(error))
      );
    });
  }

  /**
   * Add middleware to the event pipeline
   */
  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute a single handler with retry logic
   */
  private async executeHandler<T>(
    event: DomainEvent<T>,
    registration: HandlerRegistration<T>
  ): Promise<void> {
    const { handler, options } = registration;
    const handlerName = options.name || 'anonymous';

    try {
      await handler(event);
      // Reset retry count on success
      registration.retryCount = 0;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error(`Event handler failed: ${handlerName}`, err, {
        eventName: event.name,
        eventId: event.eventId,
        retryCount: registration.retryCount,
      });

      // Retry logic
      if (
        registration.retryCount < (options.maxRetries || 3) &&
        options.retryDelayMs &&
        options.retryDelayMs > 0
      ) {
        registration.retryCount++;

        logger.info('Retrying event handler', {
          handlerName,
          eventName: event.name,
          retryCount: registration.retryCount,
          maxRetries: options.maxRetries ?? 3,
        });

        // Wait before retry
        await this.delay(options.retryDelayMs);

        // Retry
        await this.executeHandler(event, registration);
      } else {
        // Max retries exceeded - add to dead letter queue
        this.addToDeadLetterQueue(event, err, registration.retryCount);
      }
    }
  }

  /**
   * Run all middleware in sequence
   */
  private async runMiddleware(event: DomainEvent): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middleware.length) {
        return;
      }

      const middleware = this.middleware[index];
      index++;

      if (middleware) {
        await middleware(event, next);
      }
    };

    await next();
  }

  /**
   * Add event to history (for debugging)
   */
  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Add failed event to dead letter queue
   */
  private addToDeadLetterQueue(event: DomainEvent, error: Error, retries: number): void {
    this.deadLetterQueue.push({
      event,
      error,
      failedAt: new Date(),
      retries,
    });

    logger.error('Event added to dead letter queue', error, {
      eventName: event.name,
      eventId: event.eventId,
      retries,
    });

    // Limit DLQ size (prevent memory leak)
    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue.shift();
    }
  }

  /**
   * Get event history (for debugging)
   */
  getHistory(): DomainEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): DeadLetterEntry[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Remove all event handlers
   */
  clear(): void {
    this.handlers.clear();
    this.middleware = [];
    this.eventHistory = [];
    this.deadLetterQueue = [];
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get handler count for an event
   */
  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.length || 0;
  }

  /**
   * Check if event has handlers
   */
  hasHandlers(eventName: string): boolean {
    return this.getHandlerCount(eventName) > 0;
  }
}

// =====================================================
// GLOBAL EVENT BUS INSTANCE
// =====================================================

/**
 * Global event bus instance
 * Use this for all application events
 */
export const eventBus = new EventBus();

// =====================================================
// TYPED EVENT EMITTER BUILDER
// =====================================================

/**
 * Create a type-safe event emitter with Zod validation
 */
export function createTypedEventEmitter<TSchema extends z.ZodType>(
  eventName: string,
  schema: TSchema
): {
  emit: (data: z.infer<TSchema>, metadata?: Record<string, unknown>) => Promise<void>;
  emitAsync: (data: z.infer<TSchema>, metadata?: Record<string, unknown>) => void;
  on: (handler: EventHandler<z.infer<TSchema>>, options?: EventHandlerOptions) => () => void;
} {
  return {
    emit: async (data: z.infer<TSchema>, metadata?: Record<string, unknown>) => {
      // Validate payload
      const validated = schema.parse(data);
      await eventBus.emit(eventName, validated, metadata);
    },
    emitAsync: (data: z.infer<TSchema>, metadata?: Record<string, unknown>) => {
      // Validate payload
      const validated = schema.parse(data);
      eventBus.emitAsync(eventName, validated, metadata);
    },
    on: (handler: EventHandler<z.infer<TSchema>>, options?: EventHandlerOptions): (() => void) => {
      return eventBus.on(eventName, handler, options);
    },
  };
}

// =====================================================
// COMMON EVENT MIDDLEWARE
// =====================================================

/**
 * Logging middleware - logs all events
 */
export const loggingMiddleware: EventMiddleware = async (event, next) => {
  logger.info('Event emitted', {
    eventName: event.name,
    eventId: event.eventId,
    timestamp: event.timestamp.toISOString(),
  });
  await next();
};

/**
 * Timing middleware - measures event handler execution time
 */
export const timingMiddleware: EventMiddleware = async (event, next) => {
  const startTime = performance.now();
  await next();
  const duration = performance.now() - startTime;

  logger.debug('Event processing completed', {
    eventName: event.name,
    eventId: event.eventId,
    duration: `${duration.toFixed(2)}ms`,
  });
};

/**
 * Validation middleware - validates event payload against schema
 */
export function createValidationMiddleware<TSchema extends z.ZodType>(
  eventName: string,
  schema: TSchema
): EventMiddleware {
  return async (event, next) => {
    if (event.name === eventName) {
      try {
        schema.parse(event.data);
      } catch (error) {
        logger.error(
          `Event validation failed: ${eventName}`,
          error instanceof Error ? error : new Error(String(error)),
          { eventId: event.eventId }
        );
        throw error;
      }
    }
    await next();
  };
}
