/**
 * Security Monitoring & Alerting Infrastructure
 *
 * **Current Architecture:**
 * - Logs structured security events to Vercel logs
 * - Query Vercel logs for security insights
 *
 * **Future Architecture (BetterStack/Logtail):**
 * - Add transport in `sendAlert()` method
 * - Keep existing logger for redundancy
 * - Add real-time alerting via webhook/API
 *
 * **Integration Example (BetterStack):**
 * ```ts
 * // In sendAlert() method:
 * if (process.env.BETTERSTACK_SOURCE_TOKEN) {
 *   await fetch('https://in.logs.betterstack.com', {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `Bearer ${process.env.BETTERSTACK_SOURCE_TOKEN}`,
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify(event),
 *   });
 * }
 * ```
 *
 * **Monitoring Queries (Vercel Logs):**
 * ```bash
 * # Auth failures in last hour
 * vercel logs --filter="securityEvent.type:auth_failure" --since=1h
 *
 * # Rate limit violations
 * vercel logs --filter="securityEvent.type:rate_limit_exceeded" --since=1h
 *
 * # Critical security events
 * vercel logs --filter="securityEvent.severity:critical" --since=24h
 * ```
 */

import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { isProduction } from '@/src/lib/schemas/env.schema';

// ============================================
// SECURITY EVENT TYPES & SCHEMAS
// ============================================

/**
 * Security event types
 */
export const SecurityEventType = {
  // Authentication events
  AUTH_FAILURE: 'auth_failure',
  AUTH_SUCCESS: 'auth_success',
  SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  RATE_LIMIT_WARNING: 'rate_limit_warning', // 80% of limit

  // Attack patterns
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',
  CSRF_TOKEN_MISMATCH: 'csrf_token_mismatch',
  SUSPICIOUS_PATTERN: 'suspicious_pattern',

  // Security policy violations
  CSP_VIOLATION: 'csp_violation',
  CORS_VIOLATION: 'cors_violation',

  // Anomalies
  UNUSUAL_TRAFFIC_SPIKE: 'unusual_traffic_spike',
  GEOGRAPHIC_ANOMALY: 'geographic_anomaly',
  VELOCITY_ANOMALY: 'velocity_anomaly', // Too many requests too fast
} as const;

export type SecurityEventType = (typeof SecurityEventType)[keyof typeof SecurityEventType];

/**
 * Security event severity levels
 */
export const SecuritySeverity = {
  CRITICAL: 'critical', // Immediate action required
  HIGH: 'high', // Action required soon
  MEDIUM: 'medium', // Monitor
  LOW: 'low', // Informational
} as const;

export type SecuritySeverity = (typeof SecuritySeverity)[keyof typeof SecuritySeverity];

/**
 * Security event schema
 */
const securityEventSchema = z.object({
  // Event identification
  type: z.enum([
    SecurityEventType.AUTH_FAILURE,
    SecurityEventType.AUTH_SUCCESS,
    SecurityEventType.SESSION_HIJACK_ATTEMPT,
    SecurityEventType.UNAUTHORIZED_ACCESS,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityEventType.RATE_LIMIT_WARNING,
    SecurityEventType.SQL_INJECTION_ATTEMPT,
    SecurityEventType.XSS_ATTEMPT,
    SecurityEventType.CSRF_TOKEN_MISMATCH,
    SecurityEventType.SUSPICIOUS_PATTERN,
    SecurityEventType.CSP_VIOLATION,
    SecurityEventType.CORS_VIOLATION,
    SecurityEventType.UNUSUAL_TRAFFIC_SPIKE,
    SecurityEventType.GEOGRAPHIC_ANOMALY,
    SecurityEventType.VELOCITY_ANOMALY,
  ] as const),
  severity: z.enum([
    SecuritySeverity.CRITICAL,
    SecuritySeverity.HIGH,
    SecuritySeverity.MEDIUM,
    SecuritySeverity.LOW,
  ] as const),

  // Context
  timestamp: z.number().int().positive(),
  message: z.string().min(1).max(500),

  // Request context
  clientIP: z.string().min(1).max(45), // IPv4/IPv6 or 'unknown'
  userAgent: z.string().max(500).optional(),
  path: z.string().max(200),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']).optional(),

  // User context (if authenticated)
  userId: z.string().min(1).optional(),
  userEmail: z.string().email().max(255).optional(),

  // Additional metadata
  metadata: z.record(z.string(), z.unknown()).optional(),

  // Deduplication
  fingerprint: z.string().min(1).max(100), // For deduplication
});

export type SecurityEvent = z.infer<typeof securityEventSchema>;

// ============================================
// DEDUPLICATION & THROTTLING
// ============================================

/**
 * In-memory event deduplication cache
 * Prevents log spam from repeated identical events
 */
class EventDeduplicator {
  private cache = new Map<
    string,
    {
      count: number;
      firstSeen: number;
      lastSeen: number;
    }
  >();

  private readonly DEDUP_WINDOW_MS = 60000; // 1 minute
  private readonly MAX_CACHE_SIZE = 10000;

  /**
   * Check if event should be logged or deduplicated
   * Returns { shouldLog: boolean, count: number }
   */
  shouldLog(fingerprint: string): { shouldLog: boolean; count: number } {
    const now = Date.now();
    const existing = this.cache.get(fingerprint);

    // First occurrence - always log
    if (!existing) {
      this.cache.set(fingerprint, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
      this.cleanup();
      return { shouldLog: true, count: 1 };
    }

    // Update stats
    existing.count++;
    existing.lastSeen = now;

    // Log every 10 occurrences or after dedup window expires
    const windowExpired = now - existing.firstSeen > this.DEDUP_WINDOW_MS;
    const shouldLog = existing.count % 10 === 0 || windowExpired;

    // Reset window if expired
    if (windowExpired) {
      existing.count = 1;
      existing.firstSeen = now;
    }

    return { shouldLog, count: existing.count };
  }

  /**
   * Cleanup old entries to prevent memory leaks
   */
  private cleanup(): void {
    if (this.cache.size < this.MAX_CACHE_SIZE) return;

    const now = Date.now();
    const cutoff = now - this.DEDUP_WINDOW_MS * 2; // 2x window for safety

    for (const [key, value] of this.cache.entries()) {
      if (value.lastSeen < cutoff) {
        this.cache.delete(key);
      }
    }

    // If still too large, clear oldest 20%
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sorted = Array.from(this.cache.entries()).sort((a, b) => a[1].lastSeen - b[1].lastSeen);
      const toDelete = Math.floor(sorted.length * 0.2);
      for (let i = 0; i < toDelete; i++) {
        const entry = sorted[i];
        if (entry) {
          this.cache.delete(entry[0]);
        }
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      totalEvents: Array.from(this.cache.values()).reduce((sum, v) => sum + v.count, 0),
    };
  }
}

// ============================================
// SECURITY MONITOR
// ============================================

/**
 * Security monitoring and alerting system
 * Logs structured events to Vercel logs (current)
 * Extensible for BetterStack/Logtail integration (future)
 */
export class SecurityMonitor {
  private deduplicator = new EventDeduplicator();
  private eventCounts = new Map<SecurityEventType, number>();

  /**
   * Log a security event
   * Handles deduplication, severity-based routing, and structured logging
   */
  async logEvent(event: Omit<SecurityEvent, 'timestamp' | 'fingerprint'>): Promise<void> {
    // Validate and enrich event
    const fingerprint = this.generateFingerprint(event);
    const enrichedEvent = securityEventSchema.parse({
      ...event,
      timestamp: Date.now(),
      fingerprint,
    });

    // Deduplication check
    const { shouldLog, count } = this.deduplicator.shouldLog(fingerprint);

    if (!shouldLog) {
      return; // Skip - deduplicated
    }

    // Update metrics
    const currentCount = this.eventCounts.get(enrichedEvent.type) || 0;
    this.eventCounts.set(enrichedEvent.type, currentCount + 1);

    // Send alert based on severity
    await this.sendAlert(enrichedEvent, count);
  }

  /**
   * Generate fingerprint for deduplication
   * Combines event type, IP, and path for unique identification
   */
  private generateFingerprint(event: Omit<SecurityEvent, 'timestamp' | 'fingerprint'>): string {
    const parts = [event.type, event.clientIP, event.path, event.userId || 'anonymous'];

    // Add metadata keys for more specific deduplication
    if (event.metadata) {
      parts.push(Object.keys(event.metadata).sort().join(','));
    }

    return parts.join('::');
  }

  /**
   * Send alert to logging infrastructure
   * Current: Vercel logs via structured logging
   * Future: Add BetterStack transport here
   */
  private async sendAlert(event: SecurityEvent, occurrenceCount: number): Promise<void> {
    // Flatten for logger compatibility (simple key-value pairs)
    const logData: Record<string, string | number> = {
      eventType: event.type,
      severity: event.severity,
      clientIP: event.clientIP,
      path: event.path,
      occurrenceCount,
      environment: isProduction ? 'production' : 'development',
      timestamp: event.timestamp,
    };

    if (event.userAgent) logData.userAgent = event.userAgent;
    if (event.method) logData.method = event.method;
    if (event.userId) logData.userId = event.userId;
    if (event.userEmail) logData.userEmail = event.userEmail;
    if (event.metadata) logData.metadata = JSON.stringify(event.metadata);

    // Route to appropriate log level based on severity
    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
        logger.error(`[SECURITY] ${event.message}`, new Error(event.message), logData);
        break;
      case SecuritySeverity.HIGH:
        logger.error(`[SECURITY] ${event.message}`, new Error(event.message), logData);
        break;
      case SecuritySeverity.MEDIUM:
        logger.warn(`[SECURITY] ${event.message}`, logData);
        break;
      case SecuritySeverity.LOW:
        logger.info(`[SECURITY] ${event.message}`, logData);
        break;
    }

    // Future: Add BetterStack transport
    // if (process.env.BETTERSTACK_SOURCE_TOKEN) {
    //   await this.sendToBetterStack(event, occurrenceCount);
    // }
  }

  /**
   * Placeholder for future BetterStack integration
   * Uncomment and configure when ready
   */
  // private async sendToBetterStack(event: SecurityEvent, occurrenceCount: number): Promise<void> {
  //   try {
  //     await fetch('https://in.logs.betterstack.com', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${process.env.BETTERSTACK_SOURCE_TOKEN}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         ...event,
  //         occurrenceCount,
  //         source: 'claudepro-directory',
  //         environment: isProduction ? 'production' : 'development',
  //       }),
  //     });
  //   } catch (error) {
  //     // Don't fail on monitoring errors - log locally
  //     logger.error('Failed to send to BetterStack', error as Error);
  //   }
  // }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      deduplication: this.deduplicator.getStats(),
      eventCounts: Object.fromEntries(this.eventCounts),
      totalEvents: Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0),
    };
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();

// ============================================
// CONVENIENCE METHODS FOR COMMON EVENTS
// ============================================

/**
 * Log authentication failure
 */
export async function logAuthFailure(params: {
  clientIP: string;
  path: string;
  userEmail?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await securityMonitor.logEvent({
    type: SecurityEventType.AUTH_FAILURE,
    severity: SecuritySeverity.HIGH,
    message: `Authentication failure: ${params.reason}`,
    clientIP: params.clientIP,
    path: params.path,
    userEmail: params.userEmail,
    metadata: params.metadata,
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(params: {
  clientIP: string;
  path: string;
  limit: number;
  actual: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await securityMonitor.logEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    severity: SecuritySeverity.MEDIUM,
    message: `Rate limit exceeded: ${params.actual}/${params.limit} requests`,
    clientIP: params.clientIP,
    path: params.path,
    metadata: { ...params.metadata, limit: params.limit, actual: params.actual },
  });
}

/**
 * Log suspicious pattern detection
 */
export async function logSuspiciousActivity(params: {
  clientIP: string;
  path: string;
  pattern: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await securityMonitor.logEvent({
    type: SecurityEventType.SUSPICIOUS_PATTERN,
    severity: SecuritySeverity.HIGH,
    message: `Suspicious pattern detected: ${params.pattern}`,
    clientIP: params.clientIP,
    path: params.path,
    metadata: params.metadata,
  });
}
