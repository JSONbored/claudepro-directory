/**
 * Inngest Function Test Setup Utilities
 *
 * Exports setup functions for Inngest function tests and action tests that use Inngest integration.
 * These functions handle mock reset and default value setup in beforeEach blocks.
 *
 * @module web-runtime/inngest/utils/test-setup
 */

import { jest } from '@jest/globals';

/**
 * Mock references for contact email function tests
 * These are populated after jest.mock() calls are hoisted
 */
export interface ContactEmailMocks {
  mockSendEmail: ReturnType<typeof jest.fn>;
  mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
  mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
    debug?: ReturnType<typeof jest.fn>; // Optional - not all test setups include debug
  };
  mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  mockNormalizeError: ReturnType<typeof jest.fn>;
  mockEscapeHtml: ReturnType<typeof jest.fn>;
}

/**
 * Setup function for contact email mocks
 * Call this in beforeEach to reset mocks and set default values
 *
 * @param operation - Operation name for logging context (default: 'sendContactEmails')
 * @param route - Route path for logging context (default: '/inngest/email/contact')
 * @returns Mock references for use in tests
 */
export function setupContactEmailMocks(
  operation = 'sendContactEmails',
  route = '/inngest/email/contact'
): ContactEmailMocks {
  // Get mocks (these are set up via jest.mock() in the test file)
  const { __mockSendEmail: mockSendEmail } = jest.requireMock('../../integrations/resend') as {
    __mockSendEmail: ReturnType<typeof jest.fn>;
  };
  const {
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  } = jest.requireMock('../../logging/server') as {
    __mockLogger: {
      info: ReturnType<typeof jest.fn>;
      warn: ReturnType<typeof jest.fn>;
      error: ReturnType<typeof jest.fn>;
      debug: ReturnType<typeof jest.fn>;
    };
    __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  };
  const {
    __mockNormalizeError: mockNormalizeError,
    __mockEscapeHtml: mockEscapeHtml,
  } = jest.requireMock('@heyclaude/shared-runtime') as {
    __mockNormalizeError: ReturnType<typeof jest.fn>;
    __mockEscapeHtml: ReturnType<typeof jest.fn>;
  };
  const { __mockRenderEmailTemplate: mockRenderEmailTemplate } = jest.requireMock(
    '../../email/base-template'
  ) as {
    __mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
  };

  // Reset all mocks
  jest.clearAllMocks();
  jest.resetAllMocks();
  mockSendEmail.mockReset();
  mockEscapeHtml.mockReset();
  mockRenderEmailTemplate.mockReset();
  mockLogger.info.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.error.mockReset();
  // debug may not exist in all mock setups
  if (mockLogger.debug) {
    mockLogger.debug.mockReset();
  }
  mockCreateWebAppContextWithId.mockReset();
  mockNormalizeError.mockReset();

  // Restore mockRenderEmailTemplate implementation after reset
  mockRenderEmailTemplate.mockImplementation(async (Template, props) => {
    const propsObj = (props || {}) as {
      name?: string;
      category?: string;
      message?: string;
      categoryEmoji?: string;
      submissionId?: string;
      email?: string;
      submittedAt?: string;
    };
    const { name, category, message, categoryEmoji, submissionId, email, submittedAt } = propsObj;

    // Check if template is a component (has name property) or is the component itself
    const templateName =
      (Template as any)?.name ||
      (Template as any)?.displayName ||
      (typeof Template === 'function' ? Template.name : 'Unknown');

    if (
      templateName === 'ContactAdminNotificationEmail' ||
      templateName.includes('ContactAdminNotification')
    ) {
      // Return HTML that includes all the data the tests expect
      return `<html>
        <body>
          <h1>${categoryEmoji || '📧'} New Contact Submission</h1>
          <p>Category: ${category}</p>
          <p>From: ${name}</p>
          <p>Email: ${email}</p>
          <p>Submission ID: ${submissionId}</p>
          <p>Submitted: ${submittedAt || new Date().toISOString()}</p>
          <p>Message: ${message}</p>
        </body>
      </html>`;
    }

    if (
      templateName === 'ContactUserConfirmationEmail' ||
      templateName.includes('ContactUserConfirmation')
    ) {
      return `<html>
        <body>
          <h1>Thanks for reaching out, ${name}!</h1>
          <p>Category: ${category}</p>
        </body>
      </html>`;
    }

    return `<html><body>Default Email</body></html>`;
  });

  // Restore normalizeError mock implementation after reset
  mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });

  // Restore escapeHtml mock implementation
  mockEscapeHtml.mockImplementation((str: string) => str);

  // Set up default successful mock responses
  mockSendEmail.mockResolvedValue({
    data: { id: 'email-id-123' },
    error: null,
  });

  // Set up logging context
  mockCreateWebAppContextWithId.mockReturnValue({
    requestId: 'test-request-id',
    operation,
    route,
  });

  return {
    mockSendEmail,
    mockRenderEmailTemplate,
    mockLogger,
    mockCreateWebAppContextWithId,
    mockNormalizeError,
    mockEscapeHtml,
  };
}

/**
 * Mock references for job lifecycle email function tests
 */
export interface JobLifecycleEmailMocks {
  mockSendEmail: ReturnType<typeof jest.fn>;
  mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
  mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  mockNormalizeError: ReturnType<typeof jest.fn>;
}

/**
 * Setup function for job lifecycle email mocks
 * Call this in beforeEach to reset mocks and set default values
 *
 * @param operation - Operation name for logging context (default: 'sendJobLifecycleEmail')
 * @param route - Route path for logging context (default: '/inngest/email/job-lifecycle')
 * @returns Mock references for use in tests
 */
export function setupJobLifecycleEmailMocks(
  operation = 'sendJobLifecycleEmail',
  route = '/inngest/email/job-lifecycle'
): JobLifecycleEmailMocks {
  // Get mocks (these are set up via jest.mock() in the test file)
  const { __mockSendEmail: mockSendEmail } = jest.requireMock('../../integrations/resend') as {
    __mockSendEmail: ReturnType<typeof jest.fn>;
  };
  const { __mockRenderEmailTemplate: mockRenderEmailTemplate } = jest.requireMock(
    '../../email/base-template'
  ) as {
    __mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
  };
  const {
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  } = jest.requireMock('../../logging/server') as {
    __mockLogger: {
      info: ReturnType<typeof jest.fn>;
      warn: ReturnType<typeof jest.fn>;
      error: ReturnType<typeof jest.fn>;
    };
    __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  };
  const { __mockNormalizeError: mockNormalizeError } = jest.requireMock(
    '@heyclaude/shared-runtime'
  ) as {
    __mockNormalizeError: ReturnType<typeof jest.fn>;
  };

  // Reset all mocks
  jest.clearAllMocks();
  jest.resetAllMocks();
  mockSendEmail.mockReset();
  mockRenderEmailTemplate.mockReset();
  mockLogger.info.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.error.mockReset();
  mockCreateWebAppContextWithId.mockReset();
  mockNormalizeError.mockReset();

  // Set up default successful mock responses
  mockSendEmail.mockResolvedValue({
    data: { id: 'email-id-123' },
    error: null,
  });
  mockRenderEmailTemplate.mockResolvedValue('<html>Mock Email</html>');

  // Restore normalizeError mock implementation after reset
  mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });

  // Set up logging context
  mockCreateWebAppContextWithId.mockReturnValue({
    requestId: 'test-request-id',
    operation,
    route,
  });

  return {
    mockSendEmail,
    mockRenderEmailTemplate,
    mockLogger,
    mockCreateWebAppContextWithId,
    mockNormalizeError,
  };
}

/**
 * Mock references for job posting drip campaign function tests
 */
export interface JobPostingDripCampaignMocks {
  mockSendEmail: ReturnType<typeof jest.fn>;
  mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
  mockGetService?: ReturnType<typeof jest.fn>; // Optional - some tests use real service factory
  mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  mockNormalizeError: ReturnType<typeof jest.fn>;
  mockEscapeHtml: ReturnType<typeof jest.fn>;
}

/**
 * Setup function for job posting drip campaign mocks
 * Call this in beforeEach to reset mocks and set default values
 *
 * @param operation - Operation name for logging context (default: 'jobPostingDripCampaign')
 * @param route - Route path for logging context (default: '/inngest/email/drip-campaigns/job-posting')
 * @returns Mock references for use in tests
 */
export function setupJobPostingDripCampaignMocks(
  operation = 'jobPostingDripCampaign',
  route = '/inngest/email/drip-campaigns/job-posting'
): JobPostingDripCampaignMocks {
  // Get mocks (these are set up via jest.mock() in the test file)
  const { __mockSendEmail: mockSendEmail } = jest.requireMock('../../integrations/resend') as {
    __mockSendEmail: ReturnType<typeof jest.fn>;
  };
  const { __mockRenderEmailTemplate: mockRenderEmailTemplate } = jest.requireMock(
    '../../email/base-template'
  ) as {
    __mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
  };
  // Service factory mock is optional - some tests use real service factory for integration testing
  let mockGetService: ReturnType<typeof jest.fn> | undefined;
  try {
    const serviceFactoryMock = jest.requireMock('../../data/service-factory') as {
      __mockGetService?: ReturnType<typeof jest.fn>;
    };
    mockGetService = serviceFactoryMock.__mockGetService;
  } catch {
    // Service factory is not mocked - tests are using real service factory
    mockGetService = undefined;
  }
  const {
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  } = jest.requireMock('../../logging/server') as {
    __mockLogger: {
      info: ReturnType<typeof jest.fn>;
      warn: ReturnType<typeof jest.fn>;
      error: ReturnType<typeof jest.fn>;
    };
    __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  };
  const {
    __mockNormalizeError: mockNormalizeError,
    __mockEscapeHtml: mockEscapeHtml,
  } = jest.requireMock('@heyclaude/shared-runtime') as {
    __mockNormalizeError: ReturnType<typeof jest.fn>;
    __mockEscapeHtml: ReturnType<typeof jest.fn>;
  };

  // Reset all mocks
  jest.clearAllMocks();
  jest.resetAllMocks();
  mockSendEmail.mockReset();
  mockRenderEmailTemplate.mockReset();
  // Only reset service factory mock if it exists (some tests use real service factory)
  if (mockGetService) {
    mockGetService.mockReset();
  }
  mockLogger.info.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.error.mockReset();
  mockCreateWebAppContextWithId.mockReset();
  mockNormalizeError.mockReset();
  mockEscapeHtml.mockReset();

  // Restore mock implementations after reset
  mockSendEmail.mockResolvedValue({
    data: { id: 'email-123' },
    error: null,
  });
  mockRenderEmailTemplate.mockResolvedValue('<html>Test Email</html>');
  mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  mockEscapeHtml.mockImplementation((text: string) => text);

  // Set up logging context
  mockCreateWebAppContextWithId.mockReturnValue({
    requestId: 'test-request-id',
    operation,
    route,
  });

  return {
    mockSendEmail,
    mockRenderEmailTemplate,
    mockGetService,
    mockLogger,
    mockCreateWebAppContextWithId,
    mockNormalizeError,
    mockEscapeHtml,
  };
}

