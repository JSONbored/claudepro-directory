/**
 * CENTRALIZED LOGGING CONFIGURATION
 * 
 * This is the SINGLE SOURCE OF TRUTH for all logging across the codebase:
 * - Redaction rules (sensitive data)
 * - Serializers (error formatting)
 * - Formatters (log structure)
 * - Base context (environment, service info)
 * - Timestamp format
 * - Log levels
 * - Transport configuration (for external log services)
 * 
 * All logger instances should import and use this configuration.
 * 
 * **Future-Proof Design:**
 * This configuration is designed to work seamlessly with:
 * - Vercel logs (current - works out of the box with Pino JSON)
 * - Datadog (via `pino-datadog-transport`)
 * - BetterStack/Logtail (via `@logtail/pino`)
 * - Any OTLP-compatible service (via `pino-opentelemetry-transport`)
 * - Elasticsearch (via `pino-elasticsearch`)
 * - Grafana Loki (via `pino-loki`)
 * - And any other Pino transport
 * 
 * To enable external log services, simply add a `transport` option when creating the logger.
 * All existing logging code will continue to work without changes.
 * 
 * @module shared-runtime/logger/config
 * @see {@link https://getpino.io/ | Pino Documentation}
 * @see {@link https://getpino.io/#/docs/transports | Pino Transports}
 */

import pino from 'pino';
import { hashUserId, hashEmail } from '../privacy.ts';

/**
 * Sensitive data patterns for redaction
 * These keys will be automatically redacted in all logs
 * 
 * @remarks
 * Redaction uses explicit paths (not wildcards) for optimal performance.
 * Wildcard redaction has ~50% overhead, so we use explicit paths instead.
 * 
 * **PII Protection (GDPR/CCPA Compliant):**
 * - User ID fields are automatically hashed (not just redacted) to maintain traceability
 * - IP addresses, phone numbers, and geolocation data are redacted
 * - The custom censor function handles hashing for user IDs
 * 
 * @see {@link https://getpino.io/#/docs/redaction | Pino Redaction Docs}
 */
export const SENSITIVE_PATTERNS = [
  // Authentication & Security
  'password',
  'token',
  'secret',
  'key',
  'api_key',
  'apiKey',
  'auth',
  'authorization',
  'bearer',
  'cookie',
  'session',
  
  // Financial PII
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
  'accountNumber',
  'account_number',
  'routingNumber',
  'routing_number',
  
  // User ID fields (PII) - will be hashed, not just redacted
  'userId',
  'user_id',
  'user.id',
  'user.userId',
  'user.user_id',
  
  // IP Address fields (PII under GDPR)
  'ip',
  'ipAddress',
  'ip_address',
  'clientIp',
  'client_ip',
  'remoteAddress',
  'remote_address',
  'x-forwarded-for',
  'xForwardedFor',
  'req.ip',
  'request.ip',
  
  // Phone number fields (PII)
  'phone',
  'phoneNumber',
  'phone_number',
  'mobile',
  'mobileNumber',
  'mobile_number',
  'telephone',
  'tel',
  'cell',
  'cellPhone',
  'cell_phone',
  
  // Geolocation fields (PII under GDPR)
  'latitude',
  'longitude',
  'lat',
  'lng',
  'geo',
  'geolocation',
  'location.lat',
  'location.lng',
  'location.latitude',
  'location.longitude',
  'coordinates',
  
  // Nested paths for common objects
  'user.password',
  'user.token',
  'user.ssn',
  'user.phone',
  'user.email',
  'user.ip',
  'args.password',
  'args.token',
  'args.secret',
  'args.key',
  'args.api_key',
  'args.auth',
  'args.phone',
  'args.ip',
  
  // Request/Response headers that may contain PII
  'headers.authorization',
  'headers.cookie',
  'headers.x-forwarded-for',
] as const;

/**
 * User ID paths that should be hashed (not just redacted)
 * These paths will use a custom censor function that hashes the value
 */
const USER_ID_PATHS = [
  'userId',
  'user_id',
  'user.id',
  'user.userId',
  'user.user_id',
] as const;

/**
 * Custom censor function for Pino redaction
 * Hashes user IDs (maintains traceability) while redacting other sensitive data
 * This maintains traceability for user IDs while protecting PII (GDPR/CCPA compliant)
 * 
 * @param value - The value to censor
 * @param path - The path to the key being redacted (e.g., ['user', 'id'] or ['userId'])
 * @returns Hashed user ID for user ID paths, '[REDACTED]' for other sensitive data
 * 
 * @see {@link https://getpino.io/#/docs/redaction | Pino Redaction with Custom Censor}
 */
function hashUserIdCensor(value: unknown, path: string[]): string {
  // Check if this is a user ID path that should be hashed
  const isUserIdPath = USER_ID_PATHS.some(userIdPath => {
    // Match exact path or nested path (e.g., 'userId' matches ['userId'], 'user.id' matches ['user', 'id'])
    const userIdPathParts = userIdPath.split('.');
    if (path.length === userIdPathParts.length) {
      return path.every((part, i) => part === userIdPathParts[i]);
    }
    return false;
  });
  
  // Hash user IDs (maintains traceability for correlation across logs)
  if (isUserIdPath && typeof value === 'string' && value.length > 0) {
    return hashUserId(value);
  }
  
  // Standard redaction for other sensitive data (passwords, tokens, etc.)
  return '[REDACTED]';
}

/**
 * Base context added to all logs
 * These fields will appear in every log message
 * 
 * @remarks
 * The `service` field is added dynamically by each package (web-runtime, edge-runtime, etc.)
 * The `env` field is automatically set from `NODE_ENV`
 */
export const BASE_CONTEXT = {
  env: typeof process !== 'undefined' && process.env?.['NODE_ENV'] || 'development',
  // Service name will be overridden by each package
  // version: process.env?.npm_package_version || '0.0.0',
} as const;

/**
 * Complete Pino Configuration Options
 * 
 * This interface includes EVERY SINGLE Pino feature available.
 * All options are optional to maintain backward compatibility.
 * 
 * @remarks
 * **Performance Notes:**
 * - Pino uses asynchronous logging by default (optimal performance)
 * - `fatal` level always sync-flushes (use only before process exit)
 * - Redaction with explicit paths has minimal overhead
 * - Wildcard redaction has ~50% overhead (we avoid it)
 * - Mixin function is called for every log (keep it fast)
 * 
 * **Future-Proof for External Log Services:**
 * - All logs are structured JSON (compatible with all services)
 * - Use `transport` option to send to external services
 * - Vercel logs work automatically (no transport needed)
 * - For Datadog: use `pino-datadog-transport`
 * - For BetterStack: use `@logtail/pino`
 * - For OTLP services: use `pino-opentelemetry-transport`
 * 
 * @see {@link https://getpino.io/#/docs/api | Pino API Documentation}
 */
export interface PinoConfigOptions {
  /**
   * Minimum log level to output
   * 
   * @default 'info' (or 'debug' if NEXT_PUBLIC_LOGGER_VERBOSE=true)
   * 
   * @remarks
   * Valid levels: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
   * Logs at or above this level will be output.
   * 
   * **Performance:** Lower levels (trace/debug) are sampled in production (10%) to reduce volume.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({ level: 'debug' });
   * logger.debug('This will be logged');
   * logger.trace('This will NOT be logged');
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#level | Pino Level Documentation}
   */
  level?: string;
  
  /**
   * Logger name/identifier
   * 
   * @default undefined (service name is used instead)
   * 
   * @remarks
   * Pino's native `name` option. If provided, adds `name` field to base context.
   * Typically, use `service` option instead for better semantic meaning.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({ name: 'my-app' });
   * // Logs will include: { "name": "my-app", ... }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#name | Pino Name Documentation}
   */
  name?: string;
  
  /**
   * Base context object added to all logs
   * 
   * @default { env: process.env.NODE_ENV || 'development' }
   * 
   * @remarks
   * Fields in `base` are merged with our default `BASE_CONTEXT`.
   * The `service` field (if provided) is also added to base context.
   * 
   * **Performance:** Base context is serialized once per logger instance (very efficient).
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   base: { region: 'us-east-1', version: '1.0.0' }
   * });
   * // All logs will include: { "region": "us-east-1", "version": "1.0.0", ... }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#base | Pino Base Documentation}
   */
  base?: Record<string, unknown>;
  
  /**
   * Timestamp formatter function
   * 
   * @default pino.stdTimeFunctions.isoTime (ISO 8601 format)
   * 
   * @remarks
   * Set to `false` to disable timestamps entirely.
   * Use `pino.stdTimeFunctions.epochTime` for Unix epoch (milliseconds).
   * Use `pino.stdTimeFunctions.isoTime` for ISO 8601 (recommended for external services).
   * Use `pino.stdTimeFunctions.isoTimeNano` for nanosecond precision (overkill for most cases).
   * 
   * **Performance:** Timestamp generation is very fast (minimal overhead).
   * 
   * @example
   * ```typescript
   * import { stdTimeFunctions } from 'pino';
   * const logger = createLogger({
   *   timestamp: stdTimeFunctions.epochTime // Unix timestamp
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#timestamp | Pino Timestamp Documentation}
   * @see {@link https://getpino.io/#/docs/api#pino-stdtimefunctions | Pino Time Functions}
   */
  timestamp?: pino.TimeFn | false;
  
  /**
   * Redaction configuration for sensitive data
   * 
   * @default { paths: SENSITIVE_PATTERNS, censor: '[REDACTED]', remove: false }
   * 
   * @remarks
   * **Performance:** Explicit paths (what we use) have minimal overhead.
   * Wildcard paths have ~50% overhead - avoid them.
   * 
   * **Redaction Modes:**
   * - `censor`: Replace value with string (default: '[REDACTED]')
   * - `remove: true`: Remove the key entirely from logs
   * - Custom function: Transform the value (e.g., show last 4 digits)
   * 
   * **Nested Paths:** Use dot notation (e.g., 'user.password', 'args.token')
   * 
   * @example
   * ```typescript
   * // Array format (simple)
   * const logger = createLogger({
   *   redact: ['password', 'token', 'user.email']
   * });
   * 
   * // Object format (advanced)
   * const logger = createLogger({
   *   redact: {
   *     paths: ['password', 'token'],
   *     censor: '***', // Custom censor string
   *     remove: false
   *   }
   * });
   * 
   * // Custom censor function
   * const logger = createLogger({
   *   redact: {
   *     paths: ['creditCard'],
   *     censor: (value, path) => {
   *       const str = String(value);
   *       return str.slice(-4).padStart(str.length, '*'); // Show last 4 digits
   *     }
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/redaction | Pino Redaction Documentation}
   */
  redact?: string[] | {
    paths: string[];
    censor?: string | ((value: unknown, path: string[]) => unknown);
    remove?: boolean;
  };
  
  /**
   * Custom serializers for specific object types
   * 
   * @default Includes standard serializers (err, req, res) and custom ones (user, request, response, dbQuery, args)
   * 
   * @remarks
   * Serializers transform objects before logging. They're called automatically when you log an object with a matching key.
   * 
   * **Standard Serializers (always included):**
   * - `err`: Error objects (via `pino.stdSerializers.err`)
   * - `req`: HTTP requests (via `pino.stdSerializers.req`)
   * - `res`: HTTP responses (via `pino.stdSerializers.res`)
   * 
   * **Custom Serializers (always included):**
   * - `user`: User objects (automatically hashes id/user_id/userId → userIdHash, extracts email, role, created_at)
   * - `request`: HTTP requests (sanitized, extracts method, url, path, headers)
   * - `response`: HTTP responses (sanitized, extracts status, headers)
   * - `dbQuery`: Database queries (extracts function, rpcName, table, args, duration_ms)
   * - `args`: Function arguments (passes through, redaction applies)
   * 
   * **Performance:** Serializers are only called when the matching key is present (efficient).
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   serializers: {
   *     // Override user serializer
   *     user: (user) => ({ id: user.id, name: user.name }),
   *     // Add custom serializer
   *     payment: (payment) => ({
   *       id: payment.id,
   *       amount: payment.amount,
   *       // Exclude sensitive card data
   *     })
   *   }
   * });
   * 
   * logger.info({ user: userObj }, 'User logged in'); // user serializer called
   * logger.info({ payment: paymentObj }, 'Payment processed'); // payment serializer called
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#serializers-object | Pino Serializers Documentation}
   */
  serializers?: Record<string, pino.SerializerFn>;
  
  /**
   * Custom key name for error objects
   * 
   * @default 'err' (Pino standard)
   * 
   * @remarks
   * By default, Pino uses 'err' as the key for error objects.
   * Some log aggregation services prefer different keys (e.g., 'error', 'exception').
   * 
   * **Note:** This only affects the key name. The error serializer still applies.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   errorKey: 'error' // Use 'error' instead of 'err'
   * });
   * logger.error({ error: new Error('Something went wrong') }, 'Error occurred');
   * // Logs: { "error": { "type": "Error", "message": "...", ... }, ... }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#errorkey-string | Pino ErrorKey Documentation}
   */
  errorKey?: string;
  
  /**
   * Formatters for customizing log output structure
   * 
   * @default { level: (label, number) => ({ level: label, levelValue: number }) }
   * 
   * @remarks
   * Formatters allow you to customize how Pino structures log output.
   * 
   * **Available Formatters:**
   * - `level`: Transform level label/number (called once per log)
   * - `bindings`: Transform base bindings (called once per logger creation)
   * - `log`: Transform entire log object (called once per log)
   * 
   * **Performance:** Formatters are called synchronously - keep them fast.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   formatters: {
   *     // Custom level format (e.g., for Datadog)
   *     level: (label) => ({ severity: label.toUpperCase() }),
   *     // Custom bindings format
   *     bindings: (bindings) => ({
   *       service: bindings.service,
   *       environment: bindings.env
   *     }),
   *     // Custom log format
   *     log: (object) => {
   *       // Add custom fields or transform structure
   *       return { ...object, customField: 'value' };
   *     }
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#formatters-object | Pino Formatters Documentation}
   */
  formatters?: {
    level?: (label: string, number: number) => object;
    bindings?: (bindings: pino.Bindings) => object;
    log?: (object: Record<string, unknown>) => Record<string, unknown>;
  };
  
  /**
   * Hooks for customizing logger behavior
   * 
   * @default { logMethod: defaultLogMethod (with 10% sampling for debug/trace in production) }
   * 
   * @remarks
   * Hooks allow you to intercept and modify logger operations.
   * 
   * **Available Hooks:**
   * - `logMethod`: Intercept log method calls (for sampling, filtering, transformation)
   * - `streamWrite`: Transform log output at stream level (for encryption, compression, etc.)
   * 
   * **Performance:** Hooks are called synchronously - keep them fast.
   * 
   * **Current Implementation:**
   * - `logMethod`: Samples 10% of debug/trace logs in production to reduce volume
   * - Uses consistent hashing for deterministic sampling (same input = same decision)
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   hooks: {
   *     // Custom log method hook (e.g., for rate limiting)
   *     logMethod: function(args, method, level) {
   *       if (shouldLog(level)) {
   *         method.apply(this, args);
   *       }
   *     },
   *     // Custom stream write hook (e.g., for encryption)
   *     streamWrite: (s) => encrypt(s)
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#hooks-object | Pino Hooks Documentation}
   */
  hooks?: {
    logMethod?: (this: pino.Logger, args: Parameters<pino.LogFn>, method: pino.LogFn, level: number) => void;
    streamWrite?: (s: string) => string;
  };
  
  /**
   * Hook called when a child logger is created
   * 
   * @default No-op function
   * 
   * @remarks
   * Called once when `logger.child()` is invoked.
   * Useful for tracking child logger creation, validation, or audit logging.
   * 
   * **Performance:** Called only when child loggers are created (infrequent).
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   onChild: (child) => {
   *     // Track child logger creation
   *     console.log('Child logger created with bindings:', child.bindings());
   *     // Validate child logger context
   *     if (!child.bindings().requestId) {
   *       console.warn('Child logger missing requestId');
   *     }
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#onchild-function | Pino OnChild Documentation}
   */
  onChild?: (child: pino.Logger) => void;
  
  /**
   * Mixin function to add dynamic context to every log
   * 
   * @default defaultMixin (injects bindings: requestId, operation, userId, route, module, etc.)
   * 
   * @remarks
   * Mixin is called for EVERY log message. It should return a new object (will be mutated by Pino).
   * 
   * **Current Implementation:**
   * - Injects context from `logger.bindings()` (set via `setBindings()` or `child()`)
   * - Adds log level information (logLevel, logLevelName)
   * - Detects error presence (hasError, isErrorLevel)
   * - Detects dbQuery/user presence (hasDbQuery, hasUser)
   * - Only adds fields not already in mergeObject (avoids duplication)
   * 
   * **Performance:** Called for every log - keep it fast. Avoid heavy computations.
   * 
   * **When to Use:**
   * - Adding dynamic context (requestId, userId, etc.) ✅
   * - Adding static metadata → Use `base` option instead
   * - Concatenating values for specific keys → Use mixin (avoids duplicate keys caveat)
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   mixin: (mergeObject, level, logger) => {
   *     // Add dynamic context from bindings
   *     const bindings = logger.bindings();
   *     return {
   *       requestId: bindings.requestId,
   *       userId: bindings.userId,
   *       timestamp: Date.now()
   *     };
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#mixin-function | Pino Mixin Documentation}
   * @see {@link https://getpino.io/#/docs/child-loggers#duplicate-keys-caveat | Duplicate Keys Caveat}
   */
  mixin?: (mergeObject: object, level: number, logger: pino.Logger) => object;
  
  /**
   * Strategy for merging mixin output with log object
   * 
   * @default (mergeObject, mixinObject) => ({ ...mixinObject, ...mergeObject })
   * 
   * @remarks
   * Controls how mixin output is merged with the explicit log object.
   * Default: mergeObject (explicit) takes priority over mixinObject (automatic).
   * 
   * **Performance:** Called for every log - keep it fast.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   mixin: () => ({ env: 'production' }),
   *   mixinMergeStrategy: (mergeObject, mixinObject) => {
   *     // Custom merge: mixin takes priority
   *     return { ...mergeObject, ...mixinObject };
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#mixinmergestrategy-function | Pino MixinMergeStrategy Documentation}
   */
  mixinMergeStrategy?: (mergeObject: object, mixinObject: object) => object;
  
  /**
   * Prefix to add to log messages (browser only)
   * 
   * @default undefined
   * 
   * @remarks
   * Only applies in browser environments.
   * If set and no custom `browser.write` is provided, creates a write function that prefixes console output.
   * 
   * **Note:** For Node.js, use formatters or mixin instead.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   msgPrefix: '[MyApp]',
   *   browser: { disabled: false }
   * });
   * // Browser console: [MyApp] { level: 30, msg: "Hello", ... }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#msgprefix-string | Pino MsgPrefix Documentation}
   */
  msgPrefix?: string;
  
  /**
   * Key to nest mixin output under
   * 
   * @default undefined (mixin output merged at root level)
   * 
   * @remarks
   * If set, mixin output is nested under this key instead of merged at root level.
   * Useful for organizing logs or avoiding conflicts with explicit log fields.
   * 
   * **Performance:** Minimal overhead (just one extra object nesting).
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   nestedKey: 'payload',
   *   mixin: () => ({ requestId: 'req-123' })
   * });
   * logger.info({ description: 'Ok' }, 'Message');
   * // Output: { "level": 30, "payload": { "requestId": "req-123", "description": "Ok" }, "msg": "Message" }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#nestedkey-string | Pino NestedKey Documentation}
   */
  nestedKey?: string;
  
  /**
   * Custom log levels beyond Pino's defaults
   * 
   * @default undefined (uses Pino's default levels)
   * 
   * @remarks
   * Define additional log levels beyond trace/debug/info/warn/error/fatal.
   * Level values must be numbers (higher = more severe).
   * 
   * **Default Levels:**
   * - trace: 10
   * - debug: 20
   * - info: 30
   * - warn: 40
   * - error: 50
   * - fatal: 60
   * 
   * **Recommendation:** Prefer structured tags over custom levels for audit/security:
   * ```typescript
   * // Instead of custom levels, use standard levels with structured tags:
   * logger.info('User action', { audit: true, action: 'login' });
   * logger.error('Security event', { securityEvent: true, severity: 'high' });
   * ```
   * 
   * This approach:
   * - Works with standard Pino TypeScript types
   * - Is portable across log aggregators
   * - Enables easy filtering (e.g., `audit:true` or `securityEvent:true`)
   * 
   * **Warning:** Custom levels require TypeScript type augmentation to avoid errors.
   * 
   * @example
   * ```typescript
   * // Only use custom levels if you have proper type augmentation
   * const logger = createLogger({
   *   customLevels: { verbose: 15 },
   *   level: 'verbose'
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#customlevels-object | Pino CustomLevels Documentation}
   */
  customLevels?: Record<string, number>;
  
  /**
   * Use only custom levels (exclude Pino's default levels)
   * 
   * @default false
   * 
   * @remarks
   * If true, only custom levels are available. Default Pino levels are disabled.
   * Logger's default `level` must be set to a custom level value.
   * 
   * **Warning:** May not be supported by all transports. Use with caution.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   customLevels: { verbose: 15 },
   *   useOnlyCustomLevels: true,
   *   level: 'verbose'
   * });
   * // logger.info() will throw - only verbose() is available
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#useonlycustomlevels-boolean | Pino UseOnlyCustomLevels Documentation}
   */
  useOnlyCustomLevels?: boolean;
  
  /**
   * Custom level comparison function or direction
   * 
   * @default 'ASC' (ascending - higher numbers = more severe)
   * 
   * @remarks
   * Controls how log levels are compared. Default is ascending (higher = more severe).
   * 
   * **Options:**
   * - 'ASC': Higher numbers = more severe (default)
   * - 'DESC': Lower numbers = more severe
   * - Custom function: (current, expected) => boolean
   * 
   * **Performance:** Called frequently - keep it fast.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   levelComparison: 'DESC' // Lower numbers = more severe
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#levelcomparison-string--function | Pino LevelComparison Documentation}
   */
  levelComparison?: 'ASC' | 'DESC' | ((current: number, expected: number) => boolean);
  
  /**
   * Browser-specific configuration
   * 
   * @default { disabled: !NEXT_PUBLIC_LOGGER_CONSOLE, serialize: true }
   * 
   * @remarks
   * Only applies in browser environments. In Node.js, this is ignored.
   * 
   * **Options:**
   * - `disabled`: Disable browser logging entirely
   * - `serialize`: Enable serializers (true) or specific ones (string[])
   * - `write`: Custom write function per log level
   * - `asObject`: Output as object instead of JSON string
   * - `asObjectBindingsOnly`: Output only bindings as object
   * - `transmit`: Send logs to server (for centralized logging)
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   browser: {
   *     disabled: false,
   *     serialize: ['err', 'req'], // Only serialize errors and requests
   *     transmit: {
   *       level: 'error',
   *       send: (level, logEvent) => {
   *         fetch('/api/logs', {
   *           method: 'POST',
   *           body: JSON.stringify(logEvent)
   *         });
   *       }
   *     }
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/browser | Pino Browser Documentation}
   */
  browser?: {
    disabled?: boolean;
    serialize?: boolean | string[];
    write?: pino.WriteFn | ({
      fatal?: pino.WriteFn;
      error?: pino.WriteFn;
      warn?: pino.WriteFn;
      info?: pino.WriteFn;
      debug?: pino.WriteFn;
      trace?: pino.WriteFn;
    } & { [logLevel: string]: pino.WriteFn });
    asObject?: boolean;
    asObjectBindingsOnly?: boolean;
    transmit?: {
      level?: pino.LevelOrString;
      send: (level: pino.Level, logEvent: pino.LogEvent) => void;
    };
  };
  
  /**
   * Service identifier (custom option, not part of Pino core)
   * 
   * @default undefined
   * 
   * @remarks
   * Custom option for our use case. Adds `service` field to base context.
   * Used to identify which service/runtime generated the log (web-runtime, edge-runtime, data-layer, etc.).
   * 
   * **Semantics:**
   * - `service`: Runtime/service identifier (web-runtime, edge-runtime, data-layer)
   * - `route`: HTTP/website URL route (user-facing endpoints like '/jobs', '/api/templates')
   * - `module`: Codebase module identifier (internal functions like 'data/marketing/site')
   * 
   * @example
   * ```typescript
   * const logger = createLogger({ service: 'web-runtime' });
   * // All logs will include: { "service": "web-runtime", ... }
   * ```
   */
  service?: string;
  
  /**
   * Transport configuration for external log processing
   * 
   * @default undefined (logs to stdout/stderr, works with Vercel)
   * 
   * @remarks
   * **Current Setup (Vercel):**
   * - No transport needed - Vercel automatically captures stdout/stderr
   * - All Pino JSON logs are automatically available in Vercel dashboard
   * - Works perfectly with structured logging
   * 
   * **Future-Proof for External Services:**
   * To send logs to external services, simply add a transport:
   * 
   * **Datadog:**
   * ```typescript
   * transport: {
   *   target: 'pino-datadog-transport',
   *   options: {
   *     ddClientConf: {
   *       authMethods: { apiKeyAuth: process.env.DATADOG_API_KEY }
   *     }
   *   },
   *   level: 'error' // Minimum level to send
   * }
   * ```
   * 
   * **BetterStack/Logtail:**
   * ```typescript
   * transport: {
   *   target: '@logtail/pino',
   *   options: {
   *     sourceToken: process.env.LOGTAIL_SOURCE_TOKEN
   *   }
   * }
   * ```
   * 
   * **OpenTelemetry (OTLP):**
   * ```typescript
   * transport: {
   *   target: 'pino-opentelemetry-transport',
   *   options: {
   *     // OTLP endpoint configuration
   *   }
   * }
   * ```
   * 
   * **Multiple Transports:**
   * ```typescript
   * transport: {
   *   targets: [
   *     { target: 'pino-pretty', level: 'debug' }, // Development only
   *     { target: 'pino-datadog-transport', level: 'error' }
   *   ]
   * }
   * ```
   * 
   * **Performance:** Transports run in a separate worker thread (no impact on main thread).
   * 
   * @example
   * ```typescript
   * // Development: Pretty printing
   * const devLogger = createLogger({
   *   transport: {
   *     target: 'pino-pretty',
   *     options: { colorize: true }
   *   }
   * });
   * 
   * // Production: External service
   * const prodLogger = createLogger({
   *   transport: {
   *     target: 'pino-datadog-transport',
   *     options: { ddClientConf: { ... } }
   *   }
   * });
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/transports | Pino Transports Documentation}
   * @see {@link https://github.com/pinojs/pino/blob/main/docs/transports.md | Pino Transports Guide}
   */
  transport?: pino.TransportSingleOptions | pino.TransportMultiOptions | pino.TransportPipelineOptions;
  
  /**
   * Enable pretty printing for local development
   * 
   * @default 'auto' - Enabled when NODE_ENV !== 'production' and no custom transport is set
   * 
   * @remarks
   * Uses `pino-pretty` to format JSON logs into human-readable, colorized output.
   * **Only for development** - production should use JSON logs for log aggregators.
   * 
   * **Behavior:**
   * - `true`: Always enable pino-pretty (overrides transport)
   * - `false`: Never enable pino-pretty
   * - `'auto'` (default): Enable only in development (NODE_ENV !== 'production')
   * 
   * **Performance:** pino-pretty runs in a worker thread, minimal main thread impact.
   * Still, avoid in production for maximum throughput.
   * 
   * @example
   * ```typescript
   * // Auto-detect based on NODE_ENV (default)
   * const logger = createLogger({ prettyPrint: 'auto' });
   * 
   * // Force pretty printing (e.g., for debugging in staging)
   * const logger = createLogger({ prettyPrint: true });
   * 
   * // Disable pretty printing (use JSON even in development)
   * const logger = createLogger({ prettyPrint: false });
   * ```
   * 
   * @see {@link https://github.com/pinojs/pino-pretty | pino-pretty Documentation}
   */
  prettyPrint?: boolean | 'auto';
  
  /**
   * Maximum depth for nested objects in logs
   * 
   * @default 10
   * 
   * @remarks
   * Limits how deeply nested objects are serialized. Objects beyond this depth
   * are truncated with `[Object]` or `[Array]`. This protects against:
   * - Excessive memory usage from deeply nested objects
   * - Denial-of-service from malicious deeply nested payloads
   * - Unreadable logs from overly verbose output
   * 
   * **Performance:** Shallow limits improve serialization speed.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   depthLimit: 5  // Only serialize 5 levels deep
   * });
   * 
   * // Deeply nested object:
   * logger.info({ a: { b: { c: { d: { e: { f: 'deep' } } } } } }, 'test');
   * // Output: { a: { b: { c: { d: { e: "[Object]" } } } } }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#depthlimit-number | Pino DepthLimit Documentation}
   */
  depthLimit?: number;
  
  /**
   * Maximum number of elements in arrays/objects
   * 
   * @default 100
   * 
   * @remarks
   * Limits how many elements are serialized in arrays and object properties.
   * Elements beyond this limit are truncated. This protects against:
   * - Excessive memory usage from large arrays
   * - Denial-of-service from malicious large payloads
   * - Unreadable logs from overly verbose output
   * 
   * **Performance:** Lower limits improve serialization speed for large arrays.
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   edgeLimit: 50  // Only serialize first 50 elements
   * });
   * 
   * // Large array:
   * logger.info({ items: new Array(1000).fill('item') }, 'test');
   * // Output: { items: ['item', 'item', ... (50 items), '...'] }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#edgelimit-number | Pino EdgeLimit Documentation}
   */
  edgeLimit?: number;
  
  /**
   * Custom key name for log messages
   * 
   * @default 'msg' (Pino standard)
   * 
   * @remarks
   * By default, Pino uses 'msg' as the key for log messages.
   * Some log aggregation services prefer different keys (e.g., 'message').
   * 
   * **Common values:**
   * - 'msg': Pino default, compact
   * - 'message': Standard for many log aggregators (DataDog, Elastic, etc.)
   * 
   * @example
   * ```typescript
   * const logger = createLogger({
   *   messageKey: 'message'  // Use 'message' instead of 'msg'
   * });
   * logger.info('Hello world');
   * // Output: { "message": "Hello world", ... }
   * ```
   * 
   * @see {@link https://getpino.io/#/docs/api#messagekey-string | Pino MessageKey Documentation}
   */
  messageKey?: string;
}

/**
 * Create Pino configuration
 * This is used by all logger instances across the codebase
 * 
 * **Optimized for:**
 * - Performance: Minimal overhead, async logging, efficient serialization
 * - Scalability: Smart redaction, log sampling in production
 * - Future-proof: Ready for external log services (Datadog, BetterStack, etc.)
 * - Resource-optimized: Smart buffering, efficient memory usage
 * - Vercel-compatible: Works perfectly with Vercel logs (current setup)
 * 
 * **About pino-pretty:**
 * - Development tool for human-readable, colorized log output
 * - Formats Pino's JSON logs into readable text
 * - Use only in development (not production)
 * - Can be used as a transport: `transport: { target: 'pino-pretty' }`
 * - Or as CLI: `node app.js | pino-pretty`
 * 
 * **About pino-final:**
 * - Separate package (`pino-final`) for handling logger finalization on process exit
 * - Ensures logs are flushed before process exits
 * - **Note:** Pino v7+ transports already handle this automatically
 * - Only needed if you're using older Pino versions or custom exit handlers
 * - Import separately: `import pinoFinal from 'pino-final'`
 * 
 * @param options - Optional configuration overrides (includes EVERY Pino feature)
 * @returns Pino logger options ready to pass to `pino()`
 * 
 * @example
 * ```typescript
 * import { createPinoConfig } from '@heyclaude/shared-runtime/logger/config';
 * import pino from 'pino';
 * 
 * // Basic usage
 * const config = createPinoConfig({ service: 'my-service' });
 * const logger = pino(config);
 * 
 * // With destination (file logging)
 * import { destination } from 'pino';
 * const config = createPinoConfig({ service: 'my-service' });
 * const logger = pino(config, destination('./app.log'));
 * 
 * // With transport (external service)
 * const config = createPinoConfig({
 *   service: 'my-service',
 *   transport: {
 *     target: 'pino-datadog-transport',
 *     options: { ddClientConf: { ... } }
 *   }
 * });
 * const logger = pino(config);
 * ```
 * 
 * @see {@link https://getpino.io/ | Pino Documentation}
 * @see {@link https://getpino.io/#/docs/transports | Pino Transports}
 */
export function createPinoConfig(options?: PinoConfigOptions): pino.LoggerOptions {
  const loggerConsoleEnabled = typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_LOGGER_CONSOLE'] === 'true';
  const loggerVerbose = typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_LOGGER_VERBOSE'] === 'true';

  // Handle redaction - support both array and object formats
  // Use custom censor function that hashes user IDs instead of just redacting them
  const redactConfig = options?.redact
    ? typeof options.redact === 'object' && !Array.isArray(options.redact)
      ? {
          paths: [
            ...SENSITIVE_PATTERNS,
            ...(options.redact.paths || []),
          ],
          // Use custom censor function if provided, otherwise use our hashUserIdCensor
          // This allows user IDs to be hashed while other sensitive data is redacted
          censor: options.redact.censor || hashUserIdCensor,
          remove: options.redact.remove ?? false,
        }
      : {
          paths: [
            ...SENSITIVE_PATTERNS,
            ...(options.redact as string[]),
          ],
          // Use custom censor function to hash user IDs
          censor: hashUserIdCensor,
          remove: false,
        }
    : {
        paths: [...SENSITIVE_PATTERNS],
        // Use custom censor function to hash user IDs automatically
        censor: hashUserIdCensor,
        remove: false,
      };

  // Build base context - include name if provided, otherwise use service
  const baseContext: Record<string, unknown> = {
    ...BASE_CONTEXT,
    ...(options?.service && { service: options.service }),
    ...options?.base,
  };
  // If name is explicitly provided, add it (Pino's native name option)
  if (options?.name) {
    baseContext['name'] = options.name;
  }

  // Build formatters - include all formatter options
  const formatters: {
    level?: (label: string, number: number) => object;
    bindings?: (bindings: pino.Bindings) => object;
    log?: (object: Record<string, unknown>) => Record<string, unknown>;
  } = {
    level: options?.formatters?.level || ((label: string, number: number) => {
      // Default: Include both label and numeric value for filtering/querying
      return { level: label, levelValue: number };
    }),
    ...(options?.formatters?.bindings && {
      bindings: options.formatters.bindings,
    }),
    ...(options?.formatters?.log && {
      log: options.formatters.log,
    }),
  };

  // Build hooks - include all hook options
  // Custom logMethod hook for log sampling and conditional logging
  const defaultLogMethod = function(this: pino.Logger, inputArgs: Parameters<pino.LogFn>, method: pino.LogFn, level: number): void {
    // Get log level name for conditional logic
    const levelName = this.levels.labels[level] || 'unknown';
    
    // Log sampling: Sample high-volume debug/trace logs in production
    // Only sample if level is debug or trace and we're in production
    const isProduction = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';
    const isHighVolumeLevel = levelName === 'debug' || levelName === 'trace';
    
    if (isProduction && isHighVolumeLevel) {
      // Sample 10% of debug/trace logs in production to reduce volume
      // Use a simple hash of the message for consistent sampling
      const logObject = inputArgs[0];
      const message = typeof inputArgs[1] === 'string' ? inputArgs[1] : '';
      const sampleKey = typeof logObject === 'object' && logObject !== null
        ? JSON.stringify(logObject) + message
        : String(logObject) + message;
      
      // Simple hash for sampling (consistent for same input)
      let hash = 0;
      for (let i = 0; i < sampleKey.length; i++) {
        const char = sampleKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Sample 10% (only log if hash % 10 === 0)
      if (Math.abs(hash) % 10 !== 0) {
        return; // Skip this log
      }
    }
    
    // Pass through to actual log method
    method.apply(this, inputArgs);
  };

  /**
   * Default streamWrite hook for defense-in-depth sanitization
   * 
   * This hook processes the final JSON string before it's written to the output stream.
   * It acts as a last line of defense to catch any sensitive data that may have slipped
   * through the redaction configuration.
   * 
   * **Patterns Sanitized:**
   * - JWT tokens (Bearer eyJ...)
   * - Stripe API keys (sk_live_..., pk_live_..., sk_test_..., pk_test_...)
   * - AWS credentials (AKIA...)
   * - Generic API keys that look like secrets
   * - Base64-encoded data that looks like credentials
   * 
   * @param s - The stringified JSON log entry
   * @returns The sanitized log string
   */
  const defaultStreamWrite = (s: string): string => {
    // JWT Bearer tokens - replace entire token with redacted placeholder
    // Pattern: Bearer followed by base64-like JWT (3 parts separated by dots)
    let result = s.replace(
      /Bearer\s+eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/gi,
      'Bearer [JWT_REDACTED]'
    );
    
    // Stripe API keys (live and test)
    result = result.replace(
      /sk_live_[A-Za-z0-9]{24,}/g,
      'sk_live_[REDACTED]'
    );
    result = result.replace(
      /pk_live_[A-Za-z0-9]{24,}/g,
      'pk_live_[REDACTED]'
    );
    result = result.replace(
      /sk_test_[A-Za-z0-9]{24,}/g,
      'sk_test_[REDACTED]'
    );
    result = result.replace(
      /pk_test_[A-Za-z0-9]{24,}/g,
      'pk_test_[REDACTED]'
    );
    
    // AWS Access Key IDs (start with AKIA, ABIA, ACCA, AGPA, AIDA, AIPA, AKIA, ANPA, ANVA, APKA, AROA, ASCA, ASIA)
    result = result.replace(
      /A[BCGIKPS][A-Z]{2}[A-Z0-9]{16}/g,
      '[AWS_KEY_REDACTED]'
    );
    
    // Generic long API keys/secrets (40+ hex or alphanumeric characters)
    // Be conservative - only match obvious patterns to avoid false positives
    result = result.replace(
      /"(?:api[_-]?key|secret[_-]?key|access[_-]?token|private[_-]?key)"\s*:\s*"[A-Za-z0-9_-]{40,}"/gi,
      (match) => {
        const colonIndex = match.indexOf(':');
        const keyPart = match.slice(0, colonIndex + 1);
        return `${keyPart} "[LONG_SECRET_REDACTED]"`;
      }
    );
    
    return result;
  };
  
  const hooks: {
    logMethod?: (this: pino.Logger, args: Parameters<pino.LogFn>, method: pino.LogFn, level: number) => void;
    streamWrite?: (s: string) => string;
  } = {
    logMethod: options?.hooks?.logMethod || defaultLogMethod,
    // Use provided streamWrite hook, or default defense-in-depth sanitizer
    streamWrite: options?.hooks?.streamWrite || defaultStreamWrite,
  };

  // Build mixin function - automatically inject context from logger bindings
  // This eliminates the need to manually pass requestId, operation, userId, etc. in every log call
  // The mixin function reads from logger.bindings() which is set via setBindings()
  // 
  // Parameters:
  // - mergeObject: The object being logged (provided by Pino, contains explicit context from log call)
  // - level: Log level (0=trace, 10=debug, 20=info, 30=warn, 40=error, 50=fatal, 60=child)
  // - logger: The Pino logger instance (used to read bindings)
  // 
  // Returns: Dynamic context object that will be merged with mergeObject via mixinMergeStrategy
  // 
  // Implementation: We enhance observability by:
  // 1. Injecting automatic context from bindings (requestId, operation, userId, etc.)
  // 2. Adding log level for filtering/analysis
  // 3. Detecting conflicts between mergeObject and bindings to avoid duplication
  // 4. Enriching context based on what's being logged
  // 
  // FIELD SEMANTICS:
  // - route: HTTP/website URL route (user-facing endpoints like '/jobs', '/api/templates')
  // - module: Codebase module identifier (internal functions like 'data/marketing/site')
  // - service: Runtime/service identifier (set at logger instance level: 'web-runtime', 'edge-runtime', 'data-layer')
  const defaultMixin = function(mergeObject: object, level: number, logger: pino.Logger): object {
    // Get current logger bindings (set via setBindings() or child logger)
    const bindings = logger.bindings();
    
    // Convert mergeObject to Record for inspection (properly using mergeObject parameter)
    const mergeObj = mergeObject as Record<string, unknown>;
    
    // Build dynamic context from bindings
    // Only include bindings that are commonly used for correlation and context
    // Use bracket notation for index signature access (TypeScript requirement)
    const dynamicContext: Record<string, unknown> = {};
    
    // Include log level in context for filtering/analysis (properly using the level parameter)
    // This enables filtering logs by severity level in observability tools
    dynamicContext['logLevel'] = level;
    dynamicContext['logLevelName'] = 
      level === 0 ? 'trace' :
      level === 10 ? 'debug' :
      level === 20 ? 'info' :
      level === 30 ? 'warn' :
      level === 40 ? 'error' :
      level === 50 ? 'fatal' :
      'unknown';
    
    // Request correlation context
    // Only add if not already present in mergeObject (avoid duplication, mergeObject takes priority)
    if (bindings['requestId'] && mergeObj['requestId'] === undefined) {
      dynamicContext['requestId'] = bindings['requestId'];
    }
    if (bindings['operation'] && mergeObj['operation'] === undefined) {
      dynamicContext['operation'] = bindings['operation'];
    }
    if (bindings['function'] && mergeObj['function'] === undefined) {
      dynamicContext['function'] = bindings['function'];
    }
    
    // User context
    // Only add if not already present in mergeObject
    if (bindings['userId'] && mergeObj['userId'] === undefined && mergeObj['user_id'] === undefined) {
      dynamicContext['userId'] = bindings['userId'];
    }
    
    // Request metadata (HTTP/website routes)
    // Only add if not already present in mergeObject
    if (bindings['method'] && mergeObj['method'] === undefined) {
      dynamicContext['method'] = bindings['method'];
    }
    if (bindings['route'] && mergeObj['route'] === undefined) {
      dynamicContext['route'] = bindings['route'];
    }
    if (bindings['path'] && mergeObj['path'] === undefined) {
      dynamicContext['path'] = bindings['path'];
    }
    
    // Codebase module identifier (for data layer functions, utilities, etc.)
    // Only add if not already present in mergeObject
    if (bindings['module'] && mergeObj['module'] === undefined) {
      dynamicContext['module'] = bindings['module'];
    }
    
    // Additional context (category, slug, etc.)
    // Only add if not already present in mergeObject
    if (bindings['category'] && mergeObj['category'] === undefined) {
      dynamicContext['category'] = bindings['category'];
    }
    if (bindings['slug'] && mergeObj['slug'] === undefined) {
      dynamicContext['slug'] = bindings['slug'];
    }
    
    // Correlation ID if available
    // Only add if not already present in mergeObject
    if (bindings['correlationId'] && mergeObj['correlationId'] === undefined) {
      dynamicContext['correlationId'] = bindings['correlationId'];
    }
    
    // Enhanced observability: Detect if dbQuery is present in mergeObject
    // If so, ensure it has proper structure for the dbQuery serializer
    if (mergeObj['dbQuery'] && typeof mergeObj['dbQuery'] === 'object') {
      // dbQuery is already present - no need to add it, but we can enhance it
      // The serializer will handle formatting, so we just ensure it's properly structured
      dynamicContext['hasDbQuery'] = true;
    }
    
    // Enhanced observability: Detect if user object is present in mergeObject
    // If so, ensure it has proper structure for the user serializer
    if (mergeObj['user'] && typeof mergeObj['user'] === 'object') {
      // user is already present - no need to add it, but we can enhance it
      // The serializer will handle formatting, so we just ensure it's properly structured
      dynamicContext['hasUser'] = true;
    }
    
    // Enhanced observability: Detect if error is present in mergeObject
    // Add error context for better error tracking
    if (mergeObj['err'] || mergeObj['error']) {
      dynamicContext['hasError'] = true;
      // Add error level indicator for observability tools
      if (level >= 40) {
        dynamicContext['isErrorLevel'] = true;
      }
    }
    
    // Return dynamic context (will be merged with mergeObject via mixinMergeStrategy)
    // mergeObject (explicit context) takes priority over dynamicContext (automatic context)
    return dynamicContext;
  };
  
  const mixinFn = options?.mixin || defaultMixin;

  // Build mixinMergeStrategy - use provided or default (mergeObject takes priority)
  // This ensures that explicitly passed context in log calls overrides automatic mixin context
  const mixinMergeStrategyFn = options?.mixinMergeStrategy || ((mergeObject: object, mixinObject: object): object => {
    // Default: mergeObject (explicitly passed) takes priority over mixinObject (automatic)
    // This allows log calls to override automatic context when needed
    return { ...mixinObject, ...mergeObject };
  });
  
  // Build onChild hook - track child logger creation for debugging and monitoring
  // In development mode, warn if child logger is missing recommended context (requestId)
  const defaultOnChild = options?.onChild || ((child: pino.Logger): void => {
    // Only validate in development mode to avoid noise in production
    const isDevelopment = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'development';
    
    if (isDevelopment) {
      const bindings = child.bindings();
      
      // Warn if child logger is missing requestId (important for request correlation)
      // This helps developers catch cases where request context is not properly propagated
      if (!bindings['requestId'] && !bindings['correlationId']) {
        // Use console.warn since this is a development-time validation
        // We don't use the logger itself to avoid potential circular issues
        console.warn(
          '[Logger] Child logger created without requestId or correlationId. ' +
          'Consider adding request context for better log correlation. ' +
          'Current bindings:', Object.keys(bindings).join(', ') || '(none)'
        );
      }
    }
  });

  // Build browser configuration - include ALL browser options
  const browserConfig: {
    disabled?: boolean;
    serialize?: boolean | string[];
    write?: pino.WriteFn | ({
      fatal?: pino.WriteFn;
      error?: pino.WriteFn;
      warn?: pino.WriteFn;
      info?: pino.WriteFn;
      debug?: pino.WriteFn;
      trace?: pino.WriteFn;
    } & { [logLevel: string]: pino.WriteFn });
    asObject?: boolean;
    asObjectBindingsOnly?: boolean;
    transmit?: {
      level?: pino.LevelOrString;
      send: (level: pino.Level, logEvent: pino.LogEvent) => void;
    };
  } = {
    disabled: options?.browser?.disabled !== undefined ? options.browser.disabled : !loggerConsoleEnabled,
    serialize: options?.browser?.serialize !== undefined ? options.browser.serialize : true,
    ...(options?.browser?.asObject !== undefined && { asObject: options.browser.asObject }),
    ...(options?.browser?.asObjectBindingsOnly !== undefined && { asObjectBindingsOnly: options.browser.asObjectBindingsOnly }),
    ...(options?.browser?.write && { write: options.browser.write }),
    ...(options?.browser?.transmit && { transmit: options.browser.transmit }),
    // Fallback: If msgPrefix is set and no custom write, use prefix write
    ...(!options?.browser?.write && options?.msgPrefix && {
      write: {
        info: (o: object) => console.info(options.msgPrefix, o),
        error: (o: object) => console.error(options.msgPrefix, o),
        warn: (o: object) => console.warn(options.msgPrefix, o),
        debug: (o: object) => console.debug(options.msgPrefix, o),
        fatal: (o: object) => console.error(options.msgPrefix, o),
        trace: (o: object) => console.trace(options.msgPrefix, o),
      },
    }),
  };

  /**
   * Custom serializers for consistent object formatting
   * These serializers extract only safe fields and ensure proper redaction
   */
  
  /**
   * User object serializer
   * Extracts safe user fields and automatically hashes PII (user IDs and emails) for privacy compliance
   * 
   * **Privacy Compliance:**
   * - Automatically hashes `id`, `user_id`, `userId` fields to `userIdHash`
   * - Automatically hashes email addresses (local part) - email is PII and must not be logged in plaintext
   * - Preserves safe metadata (role, created_at) for debugging
   * - Complies with GDPR/CCPA by never logging raw user identifiers or email addresses
   * 
   * **Dual Protection Strategy:**
   * 1. **Serializer** (this function) - Handles user objects logged with `{ user: userObj }`
   * 2. **Redaction** - Automatically hashes user ID fields anywhere in logs (e.g., `{ userId: 'abc' }`)
   * 
   * This ensures user IDs are always hashed regardless of how they're logged.
   * 
   * **Usage:**
   * When you log a user object with the `user` key, this serializer is automatically called:
   * ```ts
   * logger.info({ user: userObj }, 'User logged in');
   * // Automatically hashes: id, user_id, userId → userIdHash
   * ```
   * 
   * User IDs in other contexts are automatically hashed by redaction:
   * ```ts
   * logger.info({ userId: 'abc123' }, 'Action'); // Automatically hashed by redaction
   * logger.info({ user: { id: 'abc123' } }, 'Action'); // Hashed by redaction too
   * ```
   */
  const userSerializer: pino.SerializerFn = (user: unknown): Record<string, unknown> | undefined => {
    if (!user || typeof user !== 'object') {
      return undefined;
    }
    
    const userObj = user as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    
    // Hash user ID fields for privacy compliance (GDPR/CCPA)
    // Check all common userId field names and hash them
    const userIdFields = ['id', 'user_id', 'userId'];
    let userIdHash: string | undefined;
    
    for (const field of userIdFields) {
      if (typeof userObj[field] === 'string' && userObj[field]) {
        userIdHash = hashUserId(userObj[field] as string);
        break; // Use first found userId field
      }
    }
    
    // Always include userIdHash if we found a userId field
    if (userIdHash) {
      result['userIdHash'] = userIdHash;
    }
    
    // Hash email addresses - email is PII and must not be logged in plaintext
    // Hash local part, optionally preserve domain for debugging (set to false for maximum privacy)
    if (typeof userObj['email'] === 'string' && userObj['email']) {
      // Default: hash local part, redact domain (maximum privacy)
      // Set preserveDomain=true in options if domain needed for debugging
      const preserveDomain = false; // Config flag: set to true to preserve domain for debugging
      result['emailHash'] = hashEmail(userObj['email'] as string, preserveDomain);
    }
    
    // Extract safe metadata fields (not PII)
    if (typeof userObj['role'] === 'string') {
      result['role'] = userObj['role'];
    }
    if (typeof userObj['created_at'] === 'string') {
      result['created_at'] = userObj['created_at'];
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  };
  
  /**
   * Database query serializer
   * Formats database query/RPC call information for logging
   */
  const dbQuerySerializer: pino.SerializerFn = (query: unknown): Record<string, unknown> | undefined => {
    if (!query || typeof query !== 'object') {
      return undefined;
    }
    
    const queryObj = query as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    
    // Extract function/RPC name
    // Use bracket notation for index signature access (TypeScript requirement)
    if (typeof queryObj['function'] === 'string') {
      result['function'] = queryObj['function'];
    }
    if (typeof queryObj['rpcName'] === 'string') {
      result['rpcName'] = queryObj['rpcName'];
    }
    if (typeof queryObj['name'] === 'string') {
      result['name'] = queryObj['name'];
    }
    
    // Extract query metadata (safe fields only)
    if (typeof queryObj['table'] === 'string') {
      result['table'] = queryObj['table'];
    }
    if (typeof queryObj['schema'] === 'string') {
      result['schema'] = queryObj['schema'];
    }
    if (typeof queryObj['operation'] === 'string') {
      result['operation'] = queryObj['operation'];
    }
    
    // Extract args if present (will be redacted by Pino's redact config)
    if (queryObj['args'] !== undefined) {
      result['args'] = queryObj['args'];
    }
    if (queryObj['parameters'] !== undefined) {
      result['parameters'] = queryObj['parameters'];
    }
    
    // Extract timing information
    if (typeof queryObj['duration_ms'] === 'number') {
      result['duration_ms'] = queryObj['duration_ms'];
    }
    if (typeof queryObj['duration'] === 'number') {
      result['duration'] = queryObj['duration'];
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  };
  
  /**
   * Function arguments serializer
   * Formats function arguments for logging (sensitive data already redacted by Pino)
   */
  const argsSerializer: pino.SerializerFn = (args: unknown): unknown => {
    // If args is already an object/array, return as-is (Pino will handle redaction)
    // This serializer mainly ensures consistent formatting
    if (args === null || args === undefined) {
      return undefined;
    }
    
    // For arrays, return as-is (Pino handles redaction)
    if (Array.isArray(args)) {
      return args;
    }
    
    // For objects, return as-is (Pino handles redaction via redact config)
    if (typeof args === 'object') {
      return args;
    }
    
    // For primitives, return as-is
    return args;
  };
  
  /**
   * HTTP Request serializer (custom, sanitized)
   * Extracts safe request fields for logging
   * Note: We keep stdSerializers.req as 'req', but this custom one can be used as 'request'
   */
  const requestSerializer: pino.SerializerFn = (request: unknown): Record<string, unknown> | undefined => {
    if (!request || typeof request !== 'object') {
      return undefined;
    }
    
    const req = request as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    
    // Extract safe request metadata
    // Use bracket notation for index signature access (TypeScript requirement)
    if (typeof req['method'] === 'string') {
      result['method'] = req['method'];
    }
    if (typeof req['url'] === 'string') {
      result['url'] = req['url'];
    }
    if (typeof req['path'] === 'string') {
      result['path'] = req['path'];
    }
    if (typeof req['pathname'] === 'string') {
      result['pathname'] = req['pathname'];
    }
    if (typeof req['route'] === 'string') {
      result['route'] = req['route'];
    }
    
    // Extract headers (sanitized - sensitive headers already redacted by Pino)
    if (req['headers'] && typeof req['headers'] === 'object') {
      const headers = req['headers'] as Record<string, unknown>;
      const safeHeaders: Record<string, unknown> = {};
      // Only include non-sensitive headers
      const safeHeaderKeys = ['content-type', 'content-length', 'user-agent', 'accept', 'accept-language'];
      for (const key of safeHeaderKeys) {
        if (headers[key] !== undefined) {
          safeHeaders[key] = headers[key];
        }
      }
      if (Object.keys(safeHeaders).length > 0) {
        result['headers'] = safeHeaders;
      }
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  };
  
  /**
   * HTTP Response serializer (custom, sanitized)
   * Extracts safe response fields for logging
   * Note: We keep stdSerializers.res as 'res', but this custom one can be used as 'response'
   */
  const responseSerializer: pino.SerializerFn = (response: unknown): Record<string, unknown> | undefined => {
    if (!response || typeof response !== 'object') {
      return undefined;
    }
    
    const res = response as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    
    // Extract safe response metadata
    // Use bracket notation for index signature access (TypeScript requirement)
    if (typeof res['status'] === 'number') {
      result['status'] = res['status'];
    }
    if (typeof res['statusCode'] === 'number') {
      result['statusCode'] = res['statusCode'];
    }
    if (typeof res['statusText'] === 'string') {
      result['statusText'] = res['statusText'];
    }
    
    // Extract headers (sanitized - sensitive headers already redacted by Pino)
    if (res['headers'] && typeof res['headers'] === 'object') {
      const headers = res['headers'] as Record<string, unknown>;
      const safeHeaders: Record<string, unknown> = {};
      // Only include non-sensitive headers
      const safeHeaderKeys = ['content-type', 'content-length', 'cache-control'];
      for (const key of safeHeaderKeys) {
        if (headers[key] !== undefined) {
          safeHeaders[key] = headers[key];
        }
      }
      if (Object.keys(safeHeaders).length > 0) {
        result['headers'] = safeHeaders;
      }
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  };

  // Build serializers - merge standard with custom
  const serializers: Record<string, pino.SerializerFn> = {
    // Standard Pino serializers
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    
    // Custom serializers for consistent object formatting
    user: userSerializer,
    request: requestSerializer,
    response: responseSerializer,
    dbQuery: dbQuerySerializer,
    args: argsSerializer,
    
    // Allow custom serializers to override defaults
    ...(options?.serializers || {}),
  };

  // Build complete config with ALL Pino features
  // Using explicit property assignment to satisfy exactOptionalPropertyTypes
  const config: pino.LoggerOptions = {
    // Core Configuration
    level: options?.level || (loggerVerbose ? 'debug' : 'info'),
    base: baseContext,
    timestamp: options?.timestamp !== undefined ? options.timestamp : pino.stdTimeFunctions.isoTime,

    // Redaction
    redact: redactConfig,

    // Serializers
    serializers,

    // Formatters
    formatters,

    // Hooks
    hooks,

    // Mixin
    mixin: mixinFn as pino.MixinFn,

    // Browser Configuration
    browser: browserConfig,
    
    // Security/Performance limits (protect against DoS and excessive memory usage)
    // depthLimit: Limits nested object depth (default: 10, Pino default is unlimited)
    // edgeLimit: Limits array/object elements (default: 100, Pino default is unlimited)
    depthLimit: options?.depthLimit ?? 10,
    edgeLimit: options?.edgeLimit ?? 100,
  };

  // Add optional properties conditionally to satisfy exactOptionalPropertyTypes
  if (options?.name) {
    config.name = options.name;
  }
  if (options?.errorKey) {
    config.errorKey = options.errorKey;
  }
  if (options?.messageKey) {
    config.messageKey = options.messageKey;
  }
  // Always set onChild (either custom or default)
  config.onChild = defaultOnChild;
  if (options?.mixinMergeStrategy) {
    config.mixinMergeStrategy = mixinMergeStrategyFn;
  }
  if (options?.msgPrefix) {
    config.msgPrefix = options.msgPrefix;
  }
  if (options?.nestedKey) {
    config.nestedKey = options.nestedKey;
  }
  // Custom levels support (user-provided only)
  // Note: Custom levels require TypeScript type augmentation to work properly.
  // For most use cases, prefer standard levels (trace/debug/info/warn/error/fatal) 
  // with structured context tags for filtering:
  //   logger.info('User action', { audit: true, ... });
  //   logger.error('Security event', { securityEvent: true, ... });
  if (options?.customLevels) {
    config.customLevels = options.customLevels;
  }
  if (options?.useOnlyCustomLevels !== undefined) {
    config.useOnlyCustomLevels = options.useOnlyCustomLevels;
  }
  if (options?.levelComparison) {
    config.levelComparison = options.levelComparison;
  }
  // Handle transport configuration
  // If prettyPrint is enabled and no custom transport provided, use pino-pretty
  const isDevelopment = typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production';
  const prettyPrintSetting = options?.prettyPrint ?? 'auto';
  const shouldPrettyPrint = 
    prettyPrintSetting === true || 
    (prettyPrintSetting === 'auto' && isDevelopment && !options?.transport);
  
  if (options?.transport) {
    // Custom transport takes precedence
    config.transport = options.transport;
  } else if (shouldPrettyPrint) {
    // Enable pino-pretty for development
    // Note: pino-pretty must be installed as a dependency
    config.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard', // Use system locale time format
        ignore: 'pid,hostname', // Hide noisy fields
        messageFormat: '{msg}', // Clean message format
        // Show these fields inline for quick debugging
        singleLine: false,
        // Error objects get special treatment
        errorLikeObjectKeys: ['err', 'error'],
        // Custom colors for our structured tags
        customColors: 'audit:cyan,securityEvent:red',
      },
    };
  }

  return config;
}
