/**
 * Circuit breaker pattern for resilient database calls
 * Prevents cascading failures by opening circuit after threshold failures
 */

import { createUtilityContext, logInfo, logWarn } from './logging.ts';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  halfOpenMaxAttempts?: number; // Max attempts in half-open state
  resetTimeoutMs: number; // Time to wait before attempting reset
}

export type CircuitState = 'closed' | 'half-open' | 'open';

interface CircuitBreakerState {
  failures: number;
  halfOpenAttempts: number;
  lastFailureTime: number;
  state: CircuitState;
}

class CircuitBreaker {
  private state: CircuitBreakerState;
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
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state.state === 'open') {
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
    if (this.state.state === 'open' && now - this.state.lastFailureTime >= this.config.resetTimeoutMs) {
      this.state.state = 'half-open';
      this.state.halfOpenAttempts = 0;
      const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
        key: this.key,
        resetTimeoutMs: this.config.resetTimeoutMs,
        state: 'half-open',
      });
      logInfo('Circuit half-open (testing recovery)', logContext);
    }
  }

  private onSuccess(): void {
    if (this.state.state === 'half-open') {
      this.state.state = 'closed';
      this.state.failures = 0;
      this.state.halfOpenAttempts = 0;
      const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
        key: this.key,
        state: 'closed',
      });
      logInfo('Circuit closed (recovery successful)', logContext);
    } else {
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === 'half-open') {
      this.state.halfOpenAttempts++;
      if (this.state.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state.state = 'open';
        this.state.halfOpenAttempts = 0;
        const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
          key: this.key,
          state: 'open',
          halfOpenAttempts: this.state.halfOpenAttempts,
        });
        logWarn('Circuit opened (half-open failures)', logContext);
      }
    } else if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'open';
      const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
        key: this.key,
        state: 'open',
        failures: this.state.failures,
        threshold: this.config.failureThreshold,
      });
      logWarn('Circuit opened (threshold exceeded)', logContext);
    }
  }

  getState(): CircuitState {
    this.updateState();
    return this.state.state;
  }

  reset(): void {
    this.state = {
      failures: 0,
      halfOpenAttempts: 0,
      lastFailureTime: 0,
      state: 'closed',
    };
  }
}

// Global circuit breaker instances per operation type
const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(key: string, config: CircuitBreakerConfig): CircuitBreaker {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, new CircuitBreaker(key, config));
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
  const breaker = getCircuitBreaker(key, config);
  return breaker.execute(fn);
}
