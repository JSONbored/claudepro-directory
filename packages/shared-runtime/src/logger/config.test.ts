/**
 * Logger Configuration Tests
 * 
 * Tests for Pino logger configuration features:
 * - Redaction patterns (IP, phone, geo, financial, user ID hashing)
 * - streamWrite hook (JWT, API key sanitization)
 * - Custom serializers
 * - Mixin function
 * - prettyPrint configuration
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import pino from 'pino';
import { createPinoConfig, SENSITIVE_PATTERNS } from './config';

describe('Logger Configuration', () => {
  describe('SENSITIVE_PATTERNS', () => {
    it('should include standard sensitive field patterns', () => {
      const patterns = SENSITIVE_PATTERNS;
      
      // Auth/credentials
      expect(patterns).toContain('password');
      expect(patterns).toContain('token');
      expect(patterns).toContain('secret');
      expect(patterns).toContain('apiKey');
      expect(patterns).toContain('api_key');
      
      // User identification (userId is hashed, not just redacted)
      expect(patterns).toContain('userId');
      expect(patterns).toContain('user_id');
      // Note: email is NOT in SENSITIVE_PATTERNS - it uses a different approach
      
      // Financial
      expect(patterns).toContain('creditCard');
      expect(patterns).toContain('credit_card');
      // Note: cardNumber is covered by credit_card patterns
      expect(patterns).toContain('cvv');
      expect(patterns).toContain('ssn');
    });

    it('should include IP address patterns', () => {
      const patterns = SENSITIVE_PATTERNS;
      
      expect(patterns).toContain('ip');
      expect(patterns).toContain('ipAddress');
      expect(patterns).toContain('ip_address');
      expect(patterns).toContain('clientIp');
      expect(patterns).toContain('client_ip');
      expect(patterns).toContain('remoteAddress');
      expect(patterns).toContain('remote_address');
    });

    it('should include phone number patterns', () => {
      const patterns = SENSITIVE_PATTERNS;
      
      expect(patterns).toContain('phone');
      expect(patterns).toContain('phoneNumber');
      expect(patterns).toContain('phone_number');
      expect(patterns).toContain('mobile');
      expect(patterns).toContain('telephone');
      expect(patterns).toContain('tel');
    });

    it('should include geolocation patterns', () => {
      const patterns = SENSITIVE_PATTERNS;
      
      expect(patterns).toContain('latitude');
      expect(patterns).toContain('longitude');
      expect(patterns).toContain('lat');
      expect(patterns).toContain('lng');
      expect(patterns).toContain('geo');
      expect(patterns).toContain('geolocation');
    });

    it('should include nested path patterns for user ID', () => {
      const patterns = SENSITIVE_PATTERNS;
      
      // Nested patterns for user ID structures
      expect(patterns.some(p => p.includes('user.id'))).toBe(true);
      expect(patterns.some(p => p.includes('user.userId'))).toBe(true);
      expect(patterns.some(p => p.includes('req.ip'))).toBe(true);
      expect(patterns.some(p => p.includes('request.ip'))).toBe(true);
    });
  });

  describe('createPinoConfig', () => {
    it('should create valid Pino config with defaults', () => {
      const config = createPinoConfig();
      
      expect(config).toBeDefined();
      expect(config.level).toBeDefined();
      expect(config.base).toBeDefined();
      expect(config.redact).toBeDefined();
      expect(config.serializers).toBeDefined();
      expect(config.hooks).toBeDefined();
    });

    it('should apply custom service name to base context', () => {
      const config = createPinoConfig({ service: 'test-service' });
      
      expect(config.base).toBeDefined();
      expect(config.base?.service).toBe('test-service');
    });

    it('should merge custom base context with defaults', () => {
      const config = createPinoConfig({
        base: { customField: 'test-value' },
      });
      
      expect(config.base).toBeDefined();
      expect(config.base?.customField).toBe('test-value');
      expect(config.base?.env).toBeDefined(); // Default env should still exist
    });

    it('should use custom log level when provided', () => {
      const config = createPinoConfig({ level: 'debug' });
      
      expect(config.level).toBe('debug');
    });
  });

  describe('Redaction Configuration', () => {
    it('should configure redaction with sensitive patterns', () => {
      const config = createPinoConfig();
      
      expect(config.redact).toBeDefined();
      
      if (typeof config.redact === 'object' && !Array.isArray(config.redact)) {
        expect(config.redact.paths).toBeDefined();
        expect(Array.isArray(config.redact.paths)).toBe(true);
        expect(config.redact.paths.length).toBeGreaterThan(0);
      }
    });

    it('should merge custom redaction paths with defaults', () => {
      const config = createPinoConfig({
        redact: {
          paths: ['customSecret', 'data.privateKey'],
        },
      });
      
      if (typeof config.redact === 'object' && !Array.isArray(config.redact)) {
        expect(config.redact.paths).toContain('customSecret');
        expect(config.redact.paths).toContain('data.privateKey');
        // Should still include default patterns
        expect(config.redact.paths).toContain('password');
      }
    });
  });

  describe('prettyPrint Configuration', () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      originalNodeEnv = process.env['NODE_ENV'];
    });

    afterEach(() => {
      if (originalNodeEnv !== undefined) {
        process.env['NODE_ENV'] = originalNodeEnv;
      } else {
        delete process.env['NODE_ENV'];
      }
    });

    it('should enable pino-pretty transport in development by default', () => {
      process.env['NODE_ENV'] = 'development';
      
      const config = createPinoConfig();
      
      // In development with default 'auto' setting, transport should be pino-pretty
      expect(config.transport).toBeDefined();
      if (config.transport && 'target' in config.transport) {
        expect(config.transport.target).toBe('pino-pretty');
      }
    });

    it('should not enable pino-pretty in production', () => {
      process.env['NODE_ENV'] = 'production';
      
      const config = createPinoConfig();
      
      // In production, no transport should be set by default
      expect(config.transport).toBeUndefined();
    });

    it('should disable pino-pretty when prettyPrint is false', () => {
      process.env['NODE_ENV'] = 'development';
      
      const config = createPinoConfig({ prettyPrint: false });
      
      // Explicitly disabled, no transport
      expect(config.transport).toBeUndefined();
    });

    it('should enable pino-pretty in production when prettyPrint is true', () => {
      process.env['NODE_ENV'] = 'production';
      
      const config = createPinoConfig({ prettyPrint: true });
      
      // Explicitly enabled, should have pino-pretty transport
      expect(config.transport).toBeDefined();
      if (config.transport && 'target' in config.transport) {
        expect(config.transport.target).toBe('pino-pretty');
      }
    });

    it('should use custom transport over pino-pretty', () => {
      process.env['NODE_ENV'] = 'development';
      
      const customTransport = {
        target: 'custom-transport',
        options: { foo: 'bar' },
      };
      
      const config = createPinoConfig({ transport: customTransport });
      
      // Custom transport takes precedence
      expect(config.transport).toEqual(customTransport);
    });
  });

  describe('Serializers', () => {
    it('should include standard Pino serializers', () => {
      const config = createPinoConfig();
      
      expect(config.serializers).toBeDefined();
      expect(config.serializers?.err).toBeDefined();
      expect(config.serializers?.req).toBeDefined();
      expect(config.serializers?.res).toBeDefined();
    });

    it('should include custom serializers', () => {
      const config = createPinoConfig();
      
      expect(config.serializers?.user).toBeDefined();
      expect(config.serializers?.request).toBeDefined();
      expect(config.serializers?.response).toBeDefined();
      expect(config.serializers?.dbQuery).toBeDefined();
      expect(config.serializers?.args).toBeDefined();
    });

    it('should allow custom serializers to override defaults', () => {
      const customUserSerializer = (user: unknown) => ({ custom: true });
      
      const config = createPinoConfig({
        serializers: {
          user: customUserSerializer,
        },
      });
      
      expect(config.serializers?.user).toBe(customUserSerializer);
    });
  });

  describe('Hooks Configuration', () => {
    it('should include logMethod hook', () => {
      const config = createPinoConfig();
      
      expect(config.hooks).toBeDefined();
      expect(config.hooks?.logMethod).toBeDefined();
    });

    it('should include streamWrite hook for defense-in-depth sanitization', () => {
      const config = createPinoConfig();
      
      expect(config.hooks).toBeDefined();
      expect(config.hooks?.streamWrite).toBeDefined();
    });
  });

  describe('streamWrite Hook - JWT Sanitization', () => {
    it('should sanitize JWT Bearer tokens in log output', () => {
      const config = createPinoConfig();
      const streamWrite = config.hooks?.streamWrite;
      
      expect(streamWrite).toBeDefined();
      
      if (streamWrite) {
        const inputWithJWT = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const output = streamWrite(inputWithJWT);
        
        expect(output).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        expect(output).toContain('[JWT_REDACTED]');
      }
    });

    it('should sanitize API keys with sk_live_ prefix (defense-in-depth)', () => {
      const config = createPinoConfig();
      const streamWrite = config.hooks?.streamWrite;
      
      if (streamWrite) {
        // Defense-in-depth: sanitize common API key patterns (sk_live_, pk_live_, etc.)
        // Even though we use Polar, this protects against third-party libraries
        const inputWithAPIKey = 'api_key: sk_live_faketestkey1234567890abcd';
        const output = streamWrite(inputWithAPIKey);
        
        expect(output).not.toContain('faketestkey1234567890abcd');
        expect(output).toContain('sk_live_[REDACTED]');
      }
    });

    it('should sanitize AWS access keys', () => {
      const config = createPinoConfig();
      const streamWrite = config.hooks?.streamWrite;
      
      if (streamWrite) {
        // AWS access key pattern (starts with AKIA)
        const inputWithAWSKey = 'aws_key: AKIAIOSFODNN7EXAMPLE';
        const output = streamWrite(inputWithAWSKey);
        
        // AWS keys should be sanitized
        expect(output).not.toContain('AKIAIOSFODNN7EXAMPLE');
        expect(output).toContain('[AWS_KEY_REDACTED]');
      }
    });
  });

  describe('onChild Hook', () => {
    it('should include onChild hook for child logger validation', () => {
      const config = createPinoConfig();
      
      expect(config.onChild).toBeDefined();
      expect(typeof config.onChild).toBe('function');
    });
  });

  describe('Mixin Function', () => {
    it('should include mixin function for dynamic context injection', () => {
      const config = createPinoConfig();
      
      expect(config.mixin).toBeDefined();
      expect(typeof config.mixin).toBe('function');
    });
  });

  describe('Logger Instance Creation', () => {
    it('should create a working Pino logger from config', () => {
      const config = createPinoConfig({
        service: 'test-logger',
        prettyPrint: false, // Disable for testing
      });
      
      // Create logger without transport for testing
      const logger = pino({
        ...config,
        transport: undefined, // Disable transport for unit test
      });
      
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should create child logger with proper bindings', () => {
      const config = createPinoConfig({
        service: 'test-logger',
        prettyPrint: false,
      });
      
      const logger = pino({
        ...config,
        transport: undefined,
      });
      
      const childLogger = logger.child({
        requestId: 'test-request-123',
        operation: 'test-operation',
      });
      
      expect(childLogger).toBeDefined();
      
      const bindings = childLogger.bindings();
      expect(bindings.requestId).toBe('test-request-123');
      expect(bindings.operation).toBe('test-operation');
    });
  });
});

describe('Integration: Redaction in Action', () => {
  it('should redact sensitive fields in logged objects', () => {
    const config = createPinoConfig({
      prettyPrint: false,
    });
    
    // Create a string destination to capture output
    const chunks: string[] = [];
    const destination = {
      write: (chunk: string) => {
        chunks.push(chunk);
        return true;
      },
    };
    
    const logger = pino(
      {
        ...config,
        transport: undefined,
      },
      destination as unknown as pino.DestinationStream
    );
    
    // Log an object with sensitive fields
    logger.info({
      user: 'test',
      password: 'my-secret-password',
      email: 'user@example.com',
    }, 'User login attempt');
    
    // Check that the output has redacted values
    const output = chunks.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('my-secret-password');
  });
});

describe('Security & Safety Limits', () => {
  describe('depthLimit', () => {
    it('should set default depthLimit to 10', () => {
      const config = createPinoConfig();
      expect(config.depthLimit).toBe(10);
    });

    it('should allow custom depthLimit', () => {
      const config = createPinoConfig({ depthLimit: 5 });
      expect(config.depthLimit).toBe(5);
    });

    it('should allow depthLimit of 0', () => {
      const config = createPinoConfig({ depthLimit: 0 });
      expect(config.depthLimit).toBe(0);
    });
  });

  describe('edgeLimit', () => {
    it('should set default edgeLimit to 100', () => {
      const config = createPinoConfig();
      expect(config.edgeLimit).toBe(100);
    });

    it('should allow custom edgeLimit', () => {
      const config = createPinoConfig({ edgeLimit: 50 });
      expect(config.edgeLimit).toBe(50);
    });

    it('should allow edgeLimit of 0', () => {
      const config = createPinoConfig({ edgeLimit: 0 });
      expect(config.edgeLimit).toBe(0);
    });
  });

  describe('messageKey', () => {
    it('should not set messageKey by default (use Pino default "msg")', () => {
      const config = createPinoConfig();
      expect(config.messageKey).toBeUndefined();
    });

    it('should allow custom messageKey', () => {
      const config = createPinoConfig({ messageKey: 'message' });
      expect(config.messageKey).toBe('message');
    });

    it('should use custom messageKey in logged output', () => {
      const config = createPinoConfig({
        messageKey: 'message',
        prettyPrint: false,
      });
      
      // Create a string destination to capture output
      const chunks: string[] = [];
      const destination = {
        write: (chunk: string) => {
          chunks.push(chunk);
          return true;
        },
      };
      
      const logger = pino(
        {
          ...config,
          transport: undefined,
        },
        destination as unknown as pino.DestinationStream
      );
      
      logger.info('Test message');
      
      const output = chunks.join('');
      const parsed = JSON.parse(output);
      expect(parsed.message).toBe('Test message');
      expect(parsed.msg).toBeUndefined();
    });
  });
});

describe('Logger Helper Utilities', () => {
  // Import the helpers for testing
  // Note: These are tested indirectly through the Pino logger API
  
  describe('isLevelEnabled via Pino', () => {
    it('should correctly report enabled levels', () => {
      const config = createPinoConfig({ level: 'warn', prettyPrint: false });
      const logger = pino({
        ...config,
        transport: undefined,
      });
      
      // With level set to 'warn' (40), debug (20) and info (30) should be disabled
      expect(logger.isLevelEnabled('debug')).toBe(false);
      expect(logger.isLevelEnabled('info')).toBe(false);
      
      // warn (40), error (50), fatal (60) should be enabled
      expect(logger.isLevelEnabled('warn')).toBe(true);
      expect(logger.isLevelEnabled('error')).toBe(true);
      expect(logger.isLevelEnabled('fatal')).toBe(true);
    });

    it('should enable all levels when level is trace', () => {
      const config = createPinoConfig({ level: 'trace', prettyPrint: false });
      const logger = pino({
        ...config,
        transport: undefined,
      });
      
      expect(logger.isLevelEnabled('trace')).toBe(true);
      expect(logger.isLevelEnabled('debug')).toBe(true);
      expect(logger.isLevelEnabled('info')).toBe(true);
      expect(logger.isLevelEnabled('warn')).toBe(true);
      expect(logger.isLevelEnabled('error')).toBe(true);
      expect(logger.isLevelEnabled('fatal')).toBe(true);
    });

    it('should disable all but fatal when level is fatal', () => {
      const config = createPinoConfig({ level: 'fatal', prettyPrint: false });
      const logger = pino({
        ...config,
        transport: undefined,
      });
      
      expect(logger.isLevelEnabled('trace')).toBe(false);
      expect(logger.isLevelEnabled('debug')).toBe(false);
      expect(logger.isLevelEnabled('info')).toBe(false);
      expect(logger.isLevelEnabled('warn')).toBe(false);
      expect(logger.isLevelEnabled('error')).toBe(false);
      expect(logger.isLevelEnabled('fatal')).toBe(true);
    });
  });

  describe('Logger level properties', () => {
    it('should report correct level name', () => {
      const config = createPinoConfig({ level: 'warn', prettyPrint: false });
      const logger = pino({
        ...config,
        transport: undefined,
      });
      
      expect(logger.level).toBe('warn');
    });

    it('should report correct level numeric value', () => {
      const config = createPinoConfig({ level: 'warn', prettyPrint: false });
      const logger = pino({
        ...config,
        transport: undefined,
      });
      
      expect(logger.levelVal).toBe(40);
    });

    it('should support dynamic level changes', () => {
      const config = createPinoConfig({ level: 'info', prettyPrint: false });
      const logger = pino({
        ...config,
        transport: undefined,
      });
      
      expect(logger.level).toBe('info');
      expect(logger.isLevelEnabled('debug')).toBe(false);
      
      // Change level dynamically
      logger.level = 'debug';
      
      expect(logger.level).toBe('debug');
      expect(logger.isLevelEnabled('debug')).toBe(true);
    });
  });
});
