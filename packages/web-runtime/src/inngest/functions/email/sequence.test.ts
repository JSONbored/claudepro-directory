/**
 * Email Sequence Inngest Function Tests
 *
 * Tests the processEmailSequence function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/sequence.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { processEmailSequence } from './sequence';

// Mock service factory, Resend integration, logging, shared-runtime, email template rendering, and monitoring
// Define mocks directly in jest.mock() factory functions to avoid hoisting issues
jest.mock('../../../data/service-factory', () => {
  const mockGetService = jest.fn();
  return {
    getService: mockGetService,
    __mockGetService: mockGetService,
  };
});

jest.mock('../../../integrations/resend', () => {
  const mockSendEmail = jest.fn();
  return {
    sendEmail: mockSendEmail,
    __mockSendEmail: mockSendEmail,
  };
});

jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'processEmailSequence',
    route: '/inngest/email/sequence',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

jest.mock('@heyclaude/shared-runtime', () => {
  const mockNormalizeError = jest.fn((error: unknown, fallbackMessage?: string) => {
    // Always return an Error object with a message property
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  return {
    normalizeError: mockNormalizeError,
    __mockNormalizeError: mockNormalizeError,
  };
});

jest.mock('../../../email/base-template', () => {
  const mockRenderEmailTemplate = jest.fn();
  return {
    renderEmailTemplate: mockRenderEmailTemplate,
    __mockRenderEmailTemplate: mockRenderEmailTemplate,
  };
});

jest.mock('../../utils/monitoring', () => ({
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

// Get mocks for use in tests
const { __mockGetService: mockGetService } = jest.requireMock('../../../data/service-factory') as {
  __mockGetService: ReturnType<typeof jest.fn>;
};
const { __mockSendEmail: mockSendEmail } = jest.requireMock('../../../integrations/resend') as {
  __mockSendEmail: ReturnType<typeof jest.fn>;
};
const {
  __mockLogger: mockLogger,
  __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
} = jest.requireMock('../../../logging/server') as {
  __mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
};
const { __mockNormalizeError: mockNormalizeError } = jest.requireMock('@heyclaude/shared-runtime') as {
  __mockNormalizeError: ReturnType<typeof jest.fn>;
};
const { __mockRenderEmailTemplate: mockRenderEmailTemplate } = jest.requireMock('../../../email/base-template') as {
  __mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
};

// Import function AFTER mocks are set up
describe('processEmailSequence', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock MiscService instance
   */
  let mockMiscService: {
    getDueSequenceEmails: ReturnType<typeof jest.fn>;
    claimEmailSequenceStep: ReturnType<typeof jest.fn>;
    updateEmailSequenceLastSent: ReturnType<typeof jest.fn>;
  };

  /**
   * Setup before each test
   * - Creates fresh test engine instance
   * - Resets all mocks to clean state
   * - Sets up default mock return values
   */
  beforeEach(() => {
    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: processEmailSequence,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetService.mockReset();
    mockSendEmail.mockReset();
    mockRenderEmailTemplate.mockReset();

    // Set up mock MiscService
    mockMiscService = {
      getDueSequenceEmails: jest.fn().mockResolvedValue([]),
      claimEmailSequenceStep: jest.fn().mockResolvedValue(true),
      updateEmailSequenceLastSent: jest.fn().mockResolvedValue(undefined),
    };

    mockGetService.mockResolvedValue(mockMiscService as never);

    // Set up default successful mock responses
    mockSendEmail.mockResolvedValue({
      data: { id: 'email-id-123' },
      error: null,
    });
    mockRenderEmailTemplate.mockResolvedValue('<html>Mock Email</html>');
    
    // Restore normalizeError mock implementation after reset
    // jest.resetAllMocks() resets mocks to return undefined, so we need to restore it
    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });
  });

  /**
   * Success case: Process multiple sequence emails
   *
   * Tests that the function successfully processes and sends multiple sequence emails.
   *
   * @remarks
   * - Verifies due emails are fetched
   * - Verifies emails are sent
   * - Verifies steps are claimed
   * - Verifies last_sent_at is updated
   * - Verifies correct return value structure
   */
  it('should process multiple sequence emails successfully', async () => {
    // Mock due sequence emails
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user1@example.com',
        step: 1,
      },
      {
        id: 'seq-2',
        email: 'user2@example.com',
        step: 2,
      },
      {
        id: 'seq-3',
        email: 'user3@example.com',
        step: 3,
      },
    ]);

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify function completed successfully
    expect(result).toHaveProperty('sent', 3);
    expect(result).toHaveProperty('failed', 0);

    // Verify due emails were fetched
    expect(mockMiscService.getDueSequenceEmails).toHaveBeenCalledTimes(1);

    // Verify all emails were claimed
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledTimes(3);
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledWith('seq-1', 1);
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledWith('seq-2', 2);
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledWith('seq-3', 3);

    // Verify all emails were sent
    expect(mockSendEmail).toHaveBeenCalledTimes(3);

    // Verify email parameters
    const emailCall1 = mockSendEmail.mock.calls[0][0];
    expect(emailCall1.to).toBe('user1@example.com');
    expect(emailCall1.subject).toBe('Welcome to Claude Pro Directory! 🎉');
    expect(emailCall1.tags).toEqual([
      { name: 'type', value: 'sequence' },
      { name: 'step', value: '1' },
      { name: 'sequence_id', value: 'seq-1' },
    ]);

    // Verify last_sent_at was updated for all
    expect(mockMiscService.updateEmailSequenceLastSent).toHaveBeenCalledTimes(3);
    expect(mockMiscService.updateEmailSequenceLastSent).toHaveBeenCalledWith('seq-1');
    expect(mockMiscService.updateEmailSequenceLastSent).toHaveBeenCalledWith('seq-2');
    expect(mockMiscService.updateEmailSequenceLastSent).toHaveBeenCalledWith('seq-3');
  });

  /**
   * Success case: Empty due emails
   *
   * Tests that the function handles empty due emails gracefully.
   *
   * @remarks
   * - Function should return sent: 0, failed: 0
   * - Should log that there are no due emails
   */
  it('should handle empty due emails gracefully', async () => {
    // Mock empty due emails
    mockMiscService.getDueSequenceEmails.mockResolvedValue([]);

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify function completed successfully
    expect(result).toHaveProperty('sent', 0);
    expect(result).toHaveProperty('failed', 0);

    // Verify no emails were sent
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockMiscService.claimEmailSequenceStep).not.toHaveBeenCalled();

    // Verify skip was logged
    // Note: logContext might be undefined in some cases, so we check for the message
    const infoCalls = mockLogger.info.mock.calls;
    const skipCall = infoCalls.find((call) => call[1] === 'No due sequence emails');
    expect(skipCall).toBeDefined();
  });

  /**
   * Success case: Batch processing
   *
   * Tests that the function correctly batches emails (batch size 5).
   *
   * @remarks
   * - Function processes emails in batches of 5
   * - Verifies multiple batch steps are created
   */
  it('should process emails in batches', async () => {
    // Create 12 emails (3 batches: 5, 5, 2)
    const dueEmails = Array.from({ length: 12 }, (_, i) => ({
      id: `seq-${i + 1}`,
      email: `user${i + 1}@example.com`,
      step: (i % 5) + 1,
    }));

    mockMiscService.getDueSequenceEmails.mockResolvedValue(dueEmails);

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify all emails were processed
    expect(result).toHaveProperty('sent', 12);
    expect(result).toHaveProperty('failed', 0);

    // Verify all emails were sent
    expect(mockSendEmail).toHaveBeenCalledTimes(12);

    // Verify all steps were claimed
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledTimes(12);
  });

  /**
   * Error case: Fetch due emails failure
   *
   * Tests that the function handles fetch failures gracefully.
   *
   * @remarks
   * - Function should catch fetch errors
   * - Should return sent: 0, failed: 0
   * - Should log the error
   */
  it('should handle fetch due emails failure gracefully', async () => {
    // Mock fetch failure
    mockMiscService.getDueSequenceEmails.mockRejectedValue(new Error('Database connection failed'));

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify function completed (didn't throw)
    expect(result).toHaveProperty('sent', 0);
    expect(result).toHaveProperty('failed', 0);

    // Verify no emails were sent
    expect(mockSendEmail).not.toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      'Failed to fetch due sequence emails'
    );
  });

  /**
   * Error case: Email send failure
   *
   * Tests that the function handles email send failures gracefully.
   *
   * @remarks
   * - Function logs send errors but doesn't throw
   * - Email is still counted as sent (step was already claimed)
   * - Should log the error for monitoring
   * - Note: This is intentional - step is already claimed, so we count as sent
   */
  it('should handle email send failure gracefully', async () => {
    // Mock due sequence emails
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user1@example.com',
        step: 1,
      },
      {
        id: 'seq-2',
        email: 'user2@example.com',
        step: 2,
      },
    ]);

    // Mock email send failure for second email
    mockSendEmail
      .mockResolvedValueOnce({
        data: { id: 'email-id-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Resend API error' },
      });

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify function completed (didn't throw)
    // Note: Email send failure doesn't throw, but it doesn't count as sent (email wasn't actually sent)
    expect(result).toHaveProperty('sent', 1); // Only first email was successfully sent
    expect(result).toHaveProperty('failed', 0);

    // Verify both emails were attempted
    expect(mockSendEmail).toHaveBeenCalledTimes(2);

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user2@example.com',
        sequenceId: 'seq-2',
        step: 2,
      }),
      'Sequence email send failed after step claim'
    );
  });

  /**
   * Success case: Already claimed email (idempotency)
   *
   * Tests that the function handles already-claimed emails gracefully.
   *
   * @remarks
   * - Function should skip emails that are already claimed
   * - Should not send duplicate emails
   * - Should log the skip
   * - Note: Skipped emails don't increment sent or failed counts
   * - Note: getService is called multiple times, so we need to mock each call
   */
  it('should skip already claimed emails (idempotency)', async () => {
    // Mock due sequence emails
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user1@example.com',
        step: 1,
      },
      {
        id: 'seq-2',
        email: 'user2@example.com',
        step: 2,
      },
    ]);

    // getService is called multiple times:
    // 1. In fetch-due-emails step
    // 2. In processSequenceEmail for seq-1 (claimEmailSequenceStep)
    // 3. In processSequenceEmail for seq-2 (claimEmailSequenceStep)
    // 4. In processSequenceEmail for seq-2 (updateEmailSequenceLastSent)
    // We need to return the same service instance each time
    mockGetService.mockResolvedValue(mockMiscService as never);

    // Mock first email already claimed, second email not claimed
    // Note: claimEmailSequenceStep is called once per email in processSequenceEmail
    // getService is called multiple times (once per email in processSequenceEmail)
    // We need to ensure the mock returns the same service instance each time
    mockMiscService.claimEmailSequenceStep
      .mockResolvedValueOnce(false) // seq-1: Already claimed
      .mockResolvedValueOnce(true); // seq-2: Not claimed

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify function completed
    // Note: When claimEmailSequenceStep returns false, processSequenceEmail returns early
    // This means sendEmail is not called, and batchSent++ doesn't happen
    // So seq-1 is skipped (not sent), seq-2 is sent
    expect(result).toHaveProperty('sent', 1);
    expect(result).toHaveProperty('failed', 0);

    // Verify only second email was sent (first was skipped due to claim failure)
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user2@example.com',
      }),
      'Resend sequence email send timed out'
    );
    
    // Verify claimEmailSequenceStep was called for both
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledTimes(2);
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledWith('seq-1', 1);
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledWith('seq-2', 2);

    // Verify skip was logged for first email
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        sequenceId: 'seq-1',
        step: 1,
        reason: 'already_processed',
      }),
      'Sequence email already claimed or not found, skipping'
    );
  });

  /**
   * Success case: All 5 email steps
   *
   * Tests that the function correctly handles all 5 email steps (1-5).
   *
   * @remarks
   * - Verifies correct subject for each step
   * - Verifies correct HTML content for each step
   */
  it('should handle all 5 email steps correctly', async () => {
    // Mock due sequence emails for all 5 steps
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      { id: 'seq-1', email: 'user@example.com', step: 1 },
      { id: 'seq-2', email: 'user@example.com', step: 2 },
      { id: 'seq-3', email: 'user@example.com', step: 3 },
      { id: 'seq-4', email: 'user@example.com', step: 4 },
      { id: 'seq-5', email: 'user@example.com', step: 5 },
    ]);

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify all emails were sent
    expect(result).toHaveProperty('sent', 5);
    expect(result).toHaveProperty('failed', 0);

    // Verify correct subjects for each step
    const subjects = [
      'Welcome to Claude Pro Directory! 🎉',
      'Getting Started with Claude Pro Directory',
      'Power User Tips for Claude',
      'Join the Claude Pro Community',
      'Stay Engaged with ClaudePro',
    ];

    mockSendEmail.mock.calls.forEach((call, index) => {
      expect(call[0].subject).toBe(subjects[index]);
      expect(call[0].tags).toEqual([
        { name: 'type', value: 'sequence' },
        { name: 'step', value: String(index + 1) },
        { name: 'sequence_id', value: `seq-${index + 1}` },
      ]);
    });
  });

  /**
   * Success case: Unknown step number
   *
   * Tests that the function handles unknown step numbers gracefully.
   *
   * @remarks
   * - Function should use default subject and content for unknown steps
   */
  it('should handle unknown step numbers gracefully', async () => {
    // Mock due sequence email with unknown step
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-unknown',
        email: 'user@example.com',
        step: 99, // Unknown step
      },
    ]);

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify email was sent
    expect(result).toHaveProperty('sent', 1);
    expect(result).toHaveProperty('failed', 0);

    // Verify default subject was used
    const emailCall = mockSendEmail.mock.calls[0][0];
    expect(emailCall.subject).toBe('Claude Pro Directory - Email 99');
    // Note: HTML content is mocked, so we can't verify the actual content
    // The mock returns '<html>Mock Email</html>', but the actual implementation
    // would return HTML containing 'Claude Pro Directory Update'
    expect(emailCall.html).toBe('<html>Mock Email</html>');
  });

  /**
   * Success case: Claim failure (not found) - treated as skip
   *
   * Tests that the function handles claim failures gracefully.
   *
   * @remarks
   * - Function should skip emails that can't be claimed
   * - Should log the skip
   * - Note: Skipped emails don't increment sent or failed counts
   * - Note: getService is called multiple times, so we need to mock each call
   */
  it('should handle claim failure gracefully', async () => {
    // Mock due sequence emails
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-not-found',
        email: 'user@example.com',
        step: 1,
      },
    ]);

    // getService is called multiple times, return same service instance
    mockGetService.mockResolvedValue(mockMiscService as never);

    // Mock claim failure (not found)
    mockMiscService.claimEmailSequenceStep.mockResolvedValue(false);

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify function completed
    // Note: When claimEmailSequenceStep returns false, processSequenceEmail returns early
    // This means sendEmail is not called, and batchSent++ doesn't happen
    expect(result).toHaveProperty('sent', 0);
    expect(result).toHaveProperty('failed', 0);

    // Verify no email was sent (claim failed, so email was skipped)
    expect(mockSendEmail).not.toHaveBeenCalled();
    
    // Verify claimEmailSequenceStep was called
    expect(mockMiscService.claimEmailSequenceStep).toHaveBeenCalledWith('seq-not-found', 1);

    // Verify skip was logged
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        sequenceId: 'seq-not-found',
        step: 1,
        reason: 'already_processed',
      }),
      'Sequence email already claimed or not found, skipping'
    );
  });

  /**
   * Error case: Update last_sent_at failure
   *
   * Tests that the function handles update failures gracefully.
   *
   * @remarks
   * - Function should throw when update fails (caught in batch try/catch)
   * - Should increment failed count
   * - Should log the error
   * - Note: Email was sent but update failed, so it's counted as failed
   */
  it('should handle update last_sent_at failure gracefully', async () => {
    // Mock due sequence emails
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user@example.com',
        step: 1,
      },
    ]);

    // Mock update failure (throws)
    mockMiscService.updateEmailSequenceLastSent.mockRejectedValue(
      new Error('Database update failed')
    );

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify function completed
    // Note: Update failure throws, so it's caught and counted as failed
    expect(result).toHaveProperty('sent', 0);
    expect(result).toHaveProperty('failed', 1);

    // Verify email was sent (before update failed)
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        sequenceId: 'seq-1',
        step: 1,
        errorMessage: 'Database update failed',
      }),
      'Failed to send sequence email'
    );
  });

  /**
   * Step test: fetch-due-emails step
   *
   * Tests the fetch-due-emails step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   * - Verifies null filtering
   */
  it('should execute fetch-due-emails step correctly', async () => {
    // Mock due sequence emails with some null values (should be filtered)
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user1@example.com',
        step: 1,
      },
      {
        id: null, // Should be filtered
        email: 'user2@example.com',
        step: 2,
      },
      {
        id: 'seq-3',
        email: null, // Should be filtered
        step: 3,
      },
      {
        id: 'seq-4',
        email: 'user4@example.com',
        step: null, // Should be filtered
      },
      {
        id: 'seq-5',
        email: 'user5@example.com',
        step: 5,
      },
    ]);

    const { result } = (await t.executeStep('fetch-due-emails')) as {
      result: Array<{ id: string; email: string; step: number }>;
    };

    // Verify step result (only non-null items)
    expect(result).toHaveLength(2); // Only seq-1 and seq-5 should pass filter
    expect(result).toEqual([
      { id: 'seq-1', email: 'user1@example.com', step: 1 },
      { id: 'seq-5', email: 'user5@example.com', step: 5 },
    ]);

    // Verify service was called
    expect(mockMiscService.getDueSequenceEmails).toHaveBeenCalledTimes(1);
  });

  /**
   * Step test: send-batch step
   *
   * Tests the send-batch step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   */
  it('should execute send-batch step correctly', async () => {
    // First execute fetch-due-emails step
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user1@example.com',
        step: 1,
      },
      {
        id: 'seq-2',
        email: 'user2@example.com',
        step: 2,
      },
    ]);

    await t.executeStep('fetch-due-emails');

    // Now execute full function to test send-batch step
    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify batch step executed
    expect(result).toHaveProperty('sent', 2);
    expect(result).toHaveProperty('failed', 0);

    // Verify emails were sent
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  /**
   * Success case: Mixed email send results in batch
   *
   * Tests that the function correctly tracks sent and failed counts in a batch.
   *
   * @remarks
   * - Function should track both sent and failed
   * - Email send failures don't throw, so they're counted as sent
   * - Only exceptions (like update failures) increment failed count
   */
  it('should track sent and failed counts correctly in batch', async () => {
    // Mock due sequence emails
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user1@example.com',
        step: 1,
      },
      {
        id: 'seq-2',
        email: 'user2@example.com',
        step: 2,
      },
      {
        id: 'seq-3',
        email: 'user3@example.com',
        step: 3,
      },
    ]);

    // Mock first email success, second send failure (but doesn't throw), third success
    mockSendEmail
      .mockResolvedValueOnce({
        data: { id: 'email-id-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Send failed' },
      })
      .mockResolvedValueOnce({
        data: { id: 'email-id-3' },
        error: null,
      });

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify correct counts
    // Note: Email send failure doesn't throw, but it doesn't count as sent (email wasn't actually sent)
    // Only successfully sent emails count as sent
    expect(result).toHaveProperty('sent', 2); // First and third emails were successfully sent
    expect(result).toHaveProperty('failed', 0);

    // Verify all emails were attempted
    expect(mockSendEmail).toHaveBeenCalledTimes(3);
  });

  /**
   * Success case: Filter null values from RPC result
   *
   * Tests that the function correctly filters out null values from RPC results.
   *
   * @remarks
   * - RPC may return null values
   * - Function should filter to only valid items
   */
  it('should filter null values from RPC result', async () => {
    // Mock RPC result with nulls (realistic scenario)
    mockMiscService.getDueSequenceEmails.mockResolvedValue([
      {
        id: 'seq-1',
        email: 'user1@example.com',
        step: 1,
      },
      {
        id: null,
        email: 'user2@example.com',
        step: 2,
      },
      {
        id: 'seq-3',
        email: null,
        step: 3,
      },
      {
        id: 'seq-4',
        email: 'user4@example.com',
        step: null,
      },
    ]);

    const { result } = (await t.execute()) as { result: { sent: number; failed: number } };

    // Verify only valid email was processed
    expect(result).toHaveProperty('sent', 1);
    expect(result).toHaveProperty('failed', 0);

    // Verify only one email was sent
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user1@example.com',
      }),
      'Resend sequence email send timed out'
    );
  });
});

