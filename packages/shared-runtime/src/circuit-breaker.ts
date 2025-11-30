/**
 * Circuit breaker pattern for resilient database calls
 * Prevents cascading failures by opening circuit after threshold failures
 */

import { createUtilityContext, logInfo, logWarn } from './logging.ts';

// =============================================================================
// Exported CircuitBreaker Class (for direct instantiation)
// =============================================================================

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before attempting reset */
  resetTimeout: number;
  /** Max attempts in half-open state */
  halfOpenMaxAttempts?: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

/**
 * Circuit breaker implementation for resilient calls.
 * Prevents cascading failures by opening circuit after threshold failures.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;
  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
  };

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxAttempts: number;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeout = options.resetTimeout;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? 1;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.updateState();
    this.metrics.totalRequests++;

    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    if (this.state === 'HALF_OPEN') {
      // Check and increment atomically to prevent race condition
      const currentAttempts = this.halfOpenAttempts++;
      if (currentAttempts >= this.halfOpenMaxAttempts) {
        this.halfOpenAttempts--; // rollback
        throw new Error('Circuit breaker is HALF_OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private updateState(): void {
    const now = Date.now();

    // Only check for state transition if circuit is open
    if (this.state === 'OPEN' && now - this.lastFailureTime >= this.resetTimeout) {
      this.state = 'HALF_OPEN';
      this.halfOpenAttempts = 0;
    }
  }

  private onSuccess(): void {
    this.metrics.successfulRequests++;
    if (this.state === 'HALF_OPEN') {
      // Success in half-open state: close the circuit
      this.state = 'CLOSED';
      this.failures = 0;
      this.halfOpenAttempts = 0;
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.metrics.failedRequests++;
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Failure in half-open state: immediately open the circuit
      this.state = 'OPEN';
      this.halfOpenAttempts = 0;
    } else if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): CircuitState {
    this.updateState();
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
    this.halfOpenAttempts = 0;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
    };
  }
}

// =============================================================================
// Internal CircuitBreaker for withCircuitBreaker function
// =============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  halfOpenMaxAttempts?: number; // Max attempts in half-open state
  resetTimeoutMs: number; // Time to wait before attempting reset
}

type InternalCircuitState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';

interface InternalCircuitBreakerState {
  failures: number;
  halfOpenAttempts: number;
  lastFailureTime: number;
  state: InternalCircuitState;
}

class InternalCircuitBreaker {
  private state: InternalCircuitBreakerState;
  private config: Required<CircuitBreakerConfig>;
  private key: string;

  constructor(key: string, config: CircuitBreakerConfig) {
    this.key = key;
    this.config = {
      failureThreshold: config.failureThreshold,
      resetTimeoutMs: config.resetTimeoutMs,
      halfOpenMaxAttempts: config.halfOpenMaxAttempts ?? 3,
    };
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state.state === 'OPEN') {
      throw new Error('Circuit breaker is open - service unavailable');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private updateState(): void {
    const now = Date.now();

    // Only check for state transition if circuit is open
    if (this.state.state === 'OPEN' && now - this.state.lastFailureTime >= this.config.resetTimeoutMs) {
      this.state.state = 'HALF_OPEN';
      this.state.halfOpenAttempts = 0;
      const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
        key: this.key,
        resetTimeoutMs: this.config.resetTimeoutMs,
        state: 'HALF_OPEN',
      });
      logInfo('Circuit half-open (testing recovery)', logContext);
    }
  }

  private onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.state = 'CLOSED';
      this.state.failures = 0;
      this.state.halfOpenAttempts = 0;
      const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
        key: this.key,
        state: 'CLOSED',
      });
      logInfo('Circuit closed (recovery successful)', logContext);
    } else {
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === 'HALF_OPEN') {
      this.state.halfOpenAttempts++;
      if (this.state.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state.state = 'OPEN';
        this.state.halfOpenAttempts = 0;
        const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
          key: this.key,
          state: 'OPEN',
          halfOpenAttempts: this.state.halfOpenAttempts,
        });
        logWarn('Circuit opened (half-open failures)', logContext);
      }
    } else if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
        key: this.key,
        state: 'OPEN',
        failures: this.state.failures,
        threshold: this.config.failureThreshold,
      });
      logWarn('Circuit opened (threshold exceeded)', logContext);
    }
  }

  getState(): InternalCircuitState {
    this.updateState();
    return this.state.state;
  }

  reset(): void {
    this.state = {
      failures: 0,
      halfOpenAttempts: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    };
  }
}

// Global circuit breaker instances per operation type
const circuitBreakers = new Map<string, InternalCircuitBreaker>();

function getInternalCircuitBreaker(key: string, config: CircuitBreakerConfig): InternalCircuitBreaker {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, new InternalCircuitBreaker(key, config));
  }
  const breaker = circuitBreakers.get(key);
  if (!breaker) {
    throw new Error(`Circuit breaker for key "${key}" was not properly initialized`);
  }
  return breaker;
}

/**
 * Default circuit breaker configs
 */
export const CIRCUIT_BREAKER_CONFIGS = {
  rpc: {
    failureThreshold: 5,
    halfOpenMaxAttempts: 2,
    resetTimeoutMs: 30_000, // 30 seconds
  },
  external: {
    failureThreshold: 3,
    halfOpenMaxAttempts: 1,
    resetTimeoutMs: 60_000, // 1 minute
  },
} as const;

/**
 * Execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  config: CircuitBreakerConfig = CIRCUIT_BREAKER_CONFIGS.rpc
): Promise<T> {
  const breaker = getInternalCircuitBreaker(key, config);
  return breaker.execute(fn);
}
