/**
 * Circuit breaker pattern for resilient database calls
 * Prevents cascading failures by opening circuit after threshold failures
 */

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeoutMs: number; // Time to wait before attempting reset
  halfOpenMaxAttempts?: number; // Max attempts in half-open state
}

export type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  halfOpenAttempts: number;
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
    await this.updateState();

    if (this.state.state === 'open') {
      throw new Error('Circuit breaker is open - service unavailable');
    }

    try {
      const result = await fn();
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure();
      throw error;
    }
  }

  private async updateState(): Promise<void> {
    const now = Date.now();

    if (this.state.state === 'open') {
      if (now - this.state.lastFailureTime >= this.config.resetTimeoutMs) {
        // Transition to half-open
        this.state.state = 'half-open';
        this.state.halfOpenAttempts = 0;
        // Lazy import to avoid circular dependencies
        const { createUtilityContext, logInfo } = await import('./logging.ts');
        const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
          key: this.key,
          state: 'half-open',
          resetTimeoutMs: this.config.resetTimeoutMs,
        });
        logInfo('Circuit half-open (testing recovery)', logContext);
      }
    }
  }

  private async onSuccess(): Promise<void> {
    if (this.state.state === 'half-open') {
      // Success in half-open state - close the circuit
      this.state.state = 'closed';
      this.state.failures = 0;
      this.state.halfOpenAttempts = 0;
      // Lazy import to avoid circular dependencies
      const { createUtilityContext, logInfo } = await import('./logging.ts');
      const logContext = createUtilityContext('circuit-breaker', 'state-transition', {
        key: this.key,
        state: 'closed',
      });
      logInfo('Circuit closed (recovery successful)', logContext);
    } else {
      // Reset failure count on success
      this.state.failures = 0;
    }
  }

  private async onFailure(): Promise<void> {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    // Lazy import to avoid circular dependencies
    const { createUtilityContext, logWarn } = await import('./logging.ts');

    if (this.state.state === 'half-open') {
      this.state.halfOpenAttempts++;
      if (this.state.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        // Too many failures in half-open - open again
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
      // Too many failures - open the circuit
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

  async getState(): Promise<CircuitState> {
    await this.updateState();
    return this.state.state;
  }

  reset(): void {
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0,
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
    resetTimeoutMs: 30000, // 30 seconds
    halfOpenMaxAttempts: 2,
  },
  external: {
    failureThreshold: 3,
    resetTimeoutMs: 60000, // 1 minute
    halfOpenMaxAttempts: 1,
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
