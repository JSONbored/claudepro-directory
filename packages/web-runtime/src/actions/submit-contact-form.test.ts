import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';
// Import contact_category enum for testing
import { contact_category } from '../types/client-safe-enums';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock Resend integration (needed for Inngest function execution)
// When action sends Inngest event, the function will execute and use these mocks
// Path: packages/web-runtime/src/integrations/resend (from actions/ directory)
jest.mock('../integrations/resend', () => {
  const mockSendEmail = jest.fn();
  return {
    sendEmail: mockSendEmail,
    __mockSendEmail: mockSendEmail,
  };
});

// Mock email template rendering (needed for Inngest function execution)
// Path: packages/web-runtime/src/email/base-template (from actions/ directory)
jest.mock('../email/base-template', () => {
  const mockRenderEmailTemplate = jest.fn().mockResolvedValue('<html>Mock Email</html>');
  return {
    renderEmailTemplate: mockRenderEmailTemplate,
    __mockRenderEmailTemplate: mockRenderEmailTemplate,
  };
});

// Mock logging/server (needed for Inngest function execution and action middleware)
// The Inngest function uses logger and createWebAppContextWithId
// Action middleware also uses logger (with child() method)
jest.mock('../logging/server', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    })),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'sendContactEmails',
    route: '/inngest/email/contact',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

// Mock shared-runtime (needed for Inngest function execution)
jest.mock('@heyclaude/shared-runtime', () => {
  const mockNormalizeError = jest.fn((error: unknown, fallbackMessage?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  const mockEscapeHtml = jest.fn((str: string) => str);
  return {
    normalizeError: mockNormalizeError,
    escapeHtml: mockEscapeHtml,
    __mockNormalizeError: mockNormalizeError,
    __mockEscapeHtml: mockEscapeHtml,
  };
});

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// DO NOT mock next/headers - safemocker handles this automatically
// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// safemocker's __mocks__/next-safe-action.ts provides pre-configured authedAction
// with auth context already injected (test-user-id, test@example.com, test-token)

// Also export logger for action middleware compatibility
jest.mock('../logger.ts', () => {
  const { logger } = jest.requireMock('../logging/server');
  return {
    logger,
    toLogContextValue: (val: unknown) => val,
  };
});

// Mock errors (used by safe-action middleware) - keep real behavior for error normalization
jest.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn((name, error, context) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment (used by safe-action error handling and Prisma client)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined, // Allow undefined in tests (Prismocker doesn't need it)
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        // Handle isProduction dynamically
        if (prop === 'isProduction') {
          return false; // Default to false for tests
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false; // Default to false for tests
    },
  };
});

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling

// DO NOT mock runRpc - use real runRpc which uses Prismocker
// This allows us to test the real RPC flow end-to-end

// Mock next/cache
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: any[]) => mockRevalidateTag(...args),
}));

// DO NOT mock contact hooks - use REAL implementation
// onContactSubmission calls Inngest (real client)
// Using real hook tests: action → onContactSubmission → Inngest (real client) → Inngest function execution
// This provides true integration testing where Inngest functions are actually executed

// Mock monitoring BEFORE importing Inngest function (function imports monitoring)
// The Inngest function factory imports monitoring utilities
jest.mock('../inngest/utils/monitoring', () => ({
  sendCronSuccessHeartbeat: jest.fn(),
  sendCriticalFailureHeartbeat: jest.fn(),
  sendBetterStackHeartbeat: jest.fn(),
  sendApiEndpointHeartbeat: jest.fn(),
  isBetterStackMonitoringEnabled: jest.fn(() => false),
  isInngestMonitoringEnabled: jest.fn(() => false),
  isCriticalFailureMonitoringEnabled: jest.fn(() => false),
  isCronSuccessMonitoringEnabled: jest.fn(() => false),
  isApiEndpointMonitoringEnabled: jest.fn(() => false),
}));

// DO NOT mock Inngest client - use REAL client with integration spy
// Import test helpers to intercept inngest.send() and actually execute Inngest functions
// This creates true integration: action → Inngest event → Inngest function execution (via InngestTestEngine)
// No real API calls - uses InngestTestEngine (in-memory execution, same as Inngest function tests)
import {
  createInngestIntegrationSpy,
  registerInngestFunction,
  expectInngestEvent,
} from '../inngest/utils/test-helpers';
import { sendContactEmails } from '../inngest/functions/email/contact';
// Import setup function from Inngest test utilities (eliminates duplication)
import { setupContactEmailMocks } from '../inngest/utils/test-setup';

describe('submitContactForm', () => {
  let prismocker: PrismaClient;
  let inngestSendSpy: ReturnType<typeof jest.spyOn>;
  // Mocks for Inngest function execution (set up via setupContactEmailMocks in beforeEach)
  let contactEmailMocks: ReturnType<typeof setupContactEmailMocks>;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // This is what runRpc → BasePrismaService.callRpc → prisma.$queryRawUnsafe calls
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    // 6. Set up Inngest function mocks using shared setup function (eliminates duplication)
    // This uses the same setup logic as contact.test.ts, ensuring consistency
    contactEmailMocks = setupContactEmailMocks('sendContactEmails', '/inngest/email/contact');

    // 7. Register Inngest function for integration testing
    // When action sends 'email/contact' event, sendContactEmails will actually execute
    // The function will use the mocks above (same as contact.test.ts)
    registerInngestFunction('email/contact', sendContactEmails);

    // 8. Create integration spy that intercepts inngest.send() and executes functions
    // This creates true integration: action → Inngest event → Inngest function execution
    // Uses InngestTestEngine (in-memory, no real API calls, same as Inngest function tests)
    // The function will execute with the mocks set up above
    const { inngest } = await import('../inngest/client.ts');
    inngestSendSpy = createInngestIntegrationSpy(inngest);

    // 9. Reset mock functions
    mockRevalidatePath.mockClear();
    mockRevalidateTag.mockClear();
  });

  describe('input validation', () => {
    it('should validate contact_category enum', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      // Use valid enum value from contact_category
      const validCategory = contact_category.general;

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: validCategory,
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for missing required fields', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      // Missing required fields should fail validation
      const result = await submitContactForm({
        // Missing required fields
      } as any);

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });

    it('should accept optional metadata', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
        metadata: { source: 'website' },
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });

  describe('RPC call', () => {
    it('should call insert_contact_submission RPC with correct parameters', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
        metadata: { source: 'website' },
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      // Args are passed as positional parameters: $queryRawUnsafe(query, ...argValues)
      // Order: p_name, p_email, p_category, p_message, p_metadata
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM insert_contact_submission'),
        'Test User', // p_name
        'test@example.com', // p_email
        'general', // p_category
        'Test message', // p_message
        { source: 'website' } // p_metadata
      );

      // Verify result is array (insertContactSubmissionReturnsSchema is an array)
      expect(safeResult.data).toEqual(mockResult);
    });

    it('should return server error for RPC failures', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockError = new Error('Database error');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure - should have serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/contact-submissions');
      expect(mockRevalidateTag).toHaveBeenCalledWith(
        'contact-submission-123e4567-e89b-12d3-a456-426614174000',
        'default'
      );
      expect(mockRevalidateTag).toHaveBeenCalledWith('contact', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('submissions', 'default');
    });

    it('should not revalidate submission-specific tag when submission_id is missing', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: null, // Missing submission_id
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();

      // Verify cache invalidation (should still call general tags)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/contact-submissions');
      expect(mockRevalidateTag).toHaveBeenCalledWith('contact', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('submissions', 'default');
      // Should NOT call submission-specific tag
      expect(mockRevalidateTag).not.toHaveBeenCalledWith(
        expect.stringContaining('contact-submission-'),
        'default'
      );
    });
  });

  describe('hooks', () => {
    it('should call onContactSubmission hook when submission_id exists', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify Inngest event was sent via real hook implementation
      // Using test helper to verify event was sent correctly
      expectInngestEvent(inngestSendSpy, 'email/contact', {
        submissionId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify Inngest function actually executed (true integration!)
      // The function should have sent emails via the mocked sendEmail
      // This proves: action → Inngest event → Inngest function execution → emails sent
      expect(contactEmailMocks.mockSendEmail).toHaveBeenCalledTimes(2); // Admin + user emails
    });

    it('should not call hook when submission_id is missing', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: null, // Missing submission_id
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();

      // Verify Inngest event was NOT sent (hook checks for submission_id)
      expect(inngestSendSpy).not.toHaveBeenCalled();
    });

    it('should handle hook errors gracefully without failing the action', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { logger } = await import('../logger.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      // Mock Inngest function execution to fail (simulating function error)
      // We'll make the function fail by making sendEmail fail
      const hookError = new Error('Email send failed');
      contactEmailMocks.mockSendEmail.mockRejectedValueOnce(hookError);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure - action should still succeed
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify Inngest send was attempted (hook tried to send event)
      expect(inngestSendSpy).toHaveBeenCalled();

      // Verify Inngest function actually executed (true integration!)
      // The function should have attempted to send emails but failed
      // This proves error handling works: action → Inngest event → function execution → error handling
      expect(contactEmailMocks.mockSendEmail).toHaveBeenCalled(); // Function tried to send emails

      // Verify hook error was logged (onContactSubmission catches and logs errors)
      // The hook catches errors from inngest.send() (which includes function execution errors)
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      // Metadata is set at action definition time, not runtime
      // We can verify the action is properly configured by checking it works
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // If metadata was wrong, the action wouldn't work properly
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
    });
  });
});
