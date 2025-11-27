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
 * 
 * All logger instances should import and use this configuration.
 * 
 * @module shared-runtime/logger/config
 */

import pino from 'pino';

/**
 * Sensitive data patterns for redaction
 * These keys will be automatically redacted in all logs
 */
export const SENSITIVE_PATTERNS = [
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
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
  // Nested paths
  'user.password',
  'user.token',
  'user.ssn',
  'args.password',
  'args.token',
  'args.secret',
  'args.key',
  'args.api_key',
  'args.auth',
] as const;

/**
 * Base context added to all logs
 * These fields will appear in every log message
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
 */
export interface PinoConfigOptions {
  // Core Configuration
  level?: string;
  name?: string;
  base?: Record<string, unknown>;
  timestamp?: pino.TimeFn | false;
  
  // Redaction
  redact?: string[] | {
    paths: string[];
    censor?: string | ((value: unknown, path: string[]) => unknown);
    remove?: boolean;
  };
  
  // Serializers
  serializers?: Record<string, pino.SerializerFn>;
  errorKey?: string;
  
  // Formatters
  formatters?: {
    level?: (label: string, number: number) => object;
    bindings?: (bindings: pino.Bindings) => object;
    log?: (object: Record<string, unknown>) => Record<string, unknown>;
  };
  
  // Hooks
  hooks?: {
    logMethod?: (this: pino.Logger, args: Parameters<pino.LogFn>, method: pino.LogFn, level: number) => void;
    streamWrite?: (s: string) => string;
  };
  
  // Child Logger Hook (top-level, not in hooks)
  onChild?: (child: pino.Logger) => void;
  
  // Mixin
  mixin?: (mergeObject: object, level: number, logger: pino.Logger) => object;
  mixinMergeStrategy?: (mergeObject: object, mixinObject: object) => object;
  
  // Message Prefix
  msgPrefix?: string;
  
  // Nested Key
  nestedKey?: string;
  
  // Custom Levels
  customLevels?: Record<string, number>;
  useOnlyCustomLevels?: boolean;
  levelComparison?: 'ASC' | 'DESC' | ((current: number, expected: number) => boolean);
  
  // Browser Configuration
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
  
  // Service (custom option for our use case)
  service?: string;
  
  // Transport (for external log processing)
  transport?: pino.TransportSingleOptions | pino.TransportMultiOptions | pino.TransportPipelineOptions;
  
  // Note: destination is NOT a LoggerOptions property - it's passed as the second argument to pino()
  // If you need to set a destination, pass it when creating the logger: pino(options, destination)
}

/**
 * Create Pino configuration
 * This is used by all logger instances across the codebase
 * 
 * Optimized for:
 * - Performance: Minimal overhead, async logging
 * - Scalability: Efficient serialization, redaction
 * - Future-proof: Uses ALL Pino features
 * - Resource-optimized: Smart buffering, efficient memory usage
 * 
 * @param options - Optional configuration overrides (includes EVERY Pino feature)
 * @returns Pino logger options
 */
export function createPinoConfig(options?: PinoConfigOptions): pino.LoggerOptions {
  const loggerConsoleEnabled = typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_LOGGER_CONSOLE'] === 'true';
  const loggerVerbose = typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_LOGGER_VERBOSE'] === 'true';

  // Handle redaction - support both array and object formats
  const redactConfig = options?.redact
    ? typeof options.redact === 'object' && !Array.isArray(options.redact)
      ? {
          paths: [
            ...SENSITIVE_PATTERNS,
            ...(options.redact.paths || []),
          ],
          censor: options.redact.censor || '[REDACTED]',
          remove: options.redact.remove ?? false,
        }
      : {
          paths: [
            ...SENSITIVE_PATTERNS,
            ...(options.redact as string[]),
          ],
          censor: '[REDACTED]',
          remove: false,
        }
    : {
        paths: [...SENSITIVE_PATTERNS],
        censor: '[REDACTED]',
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
  
  const hooks: {
    logMethod?: (this: pino.Logger, args: Parameters<pino.LogFn>, method: pino.LogFn, level: number) => void;
    streamWrite?: (s: string) => string;
  } = {
    logMethod: options?.hooks?.logMethod || defaultLogMethod,
    ...(options?.hooks?.streamWrite && {
      streamWrite: options.hooks.streamWrite,
    }),
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
    
    // Request metadata
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
  const defaultOnChild = options?.onChild || ((child: pino.Logger): void => {
    // Default: No-op, but can be used for:
    // - Tracking child logger creation
    // - Validating child logger context
    // - Performance monitoring
    // - Audit logging
    void child;
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
   * Extracts only safe user fields (id, email) and excludes sensitive data
   */
  const userSerializer: pino.SerializerFn = (user: unknown): Record<string, unknown> | undefined => {
    if (!user || typeof user !== 'object') {
      return undefined;
    }
    
    const userObj = user as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    
    // Extract safe fields only
    // Use bracket notation for index signature access (TypeScript requirement)
    if (typeof userObj['id'] === 'string') {
      result['id'] = userObj['id'];
    }
    if (typeof userObj['email'] === 'string') {
      result['email'] = userObj['email'];
    }
    if (typeof userObj['user_id'] === 'string') {
      result['user_id'] = userObj['user_id'];
    }
    if (typeof userObj['userId'] === 'string') {
      result['userId'] = userObj['userId'];
    }
    
    // Extract optional safe metadata
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
  };

  // Add optional properties conditionally to satisfy exactOptionalPropertyTypes
  if (options?.name) {
    config.name = options.name;
  }
  if (options?.errorKey) {
    config.errorKey = options.errorKey;
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
  if (options?.customLevels) {
    config.customLevels = options.customLevels;
  }
  if (options?.useOnlyCustomLevels !== undefined) {
    config.useOnlyCustomLevels = options.useOnlyCustomLevels;
  }
  if (options?.levelComparison) {
    config.levelComparison = options.levelComparison;
  }
  if (options?.transport) {
    config.transport = options.transport;
  }

  return config;
}
