/**
 * Notifications Create Inngest Function Integration Tests
 *
 * Tests createNotification and broadcastNotification functions → MiscService → database flow.
 * Uses InngestTestEngine, Prismocker for in-memory database, and real service factory.
 *
 * @group Inngest
 * @group Notifications
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { createNotification, broadcastNotification } from './create';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Use real service factory (return actual services)
jest.mock('../../../data/service-factory', () => {
  // Import real service factory to return real services
  const actual = jest.requireActual('../../../data/service-factory');
  return {
    ...actual,
    getService: actual.getService, // Use real getService which returns real services
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
    operation: 'createNotification',
    route: '/inngest/notifications/create',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

jest.mock('../../utils/monitoring', () => ({
  isBetterStackMonitoringEnabled: jest.fn().mockReturnValue(false),
  isInngestMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCriticalFailureMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCronSuccessMonitoringEnabled: jest.fn().mockReturnValue(false),
  isApiEndpointMonitoringEnabled: jest.fn().mockReturnValue(false),
  sendBetterStackHeartbeat: jest.fn(),
  sendCriticalFailureHeartbeat: jest.fn(),
  sendCronSuccessHeartbeat: jest.fn(),
  sendApiEndpointHeartbeat: jest.fn(),
}));

describe('createNotification', () => {
  let t: InngestTestEngine;
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: createNotification,
    });

    // Initialize Prismocker and clear cache for a clean test state
    prismocker = prisma as unknown as PrismaClient;
    clearRequestCache();

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  /**
   * Cleanup after each test to prevent open handles
   */
  afterEach(async () => {
    // Clear all timers
    jest.clearAllTimers();

    // Ensure all pending promises are resolved
    await new Promise((resolve) => setImmediate(resolve));

    // Clear the test engine reference to allow garbage collection
    (t as any) = null;
  });

  /**
   * Success case: Create notification with all fields
   *
   * Tests that notification is created successfully with all optional fields.
   */
  it('should create notification with all fields successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'notification/create',
          data: {
            title: 'Test Title',
            message: 'Test Message',
            type: 'announcement',
            priority: 'high',
            action_label: 'Learn More',
            action_href: 'https://example.com',
            id: 'custom-id-123',
          },
        },
      ],
    })) as { result: { success: boolean; notificationId: string } };

    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('custom-id-123');

    // Verify notification was created in Prismocker
    const notification = await prismocker.notifications.findUnique({
      where: { id: 'custom-id-123' },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Test Title');
    expect(notification?.message).toBe('Test Message');
    expect(notification?.type).toBe('announcement');
    expect(notification?.priority).toBe('high');
    expect(notification?.action_label).toBe('Learn More');
    expect(notification?.action_href).toBe('https://example.com');
  });

  /**
   * Success case: Create notification with minimal fields
   *
   * Tests that notification is created with only required fields.
   */
  it('should create notification with minimal fields successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'notification/create',
          data: {
            title: 'Test Title',
            message: 'Test Message',
          },
        },
      ],
    })) as { result: { success: boolean; notificationId: string } };

    expect(result.success).toBe(true);
    expect(result.notificationId).toBeDefined();

    // Verify notification was created in Prismocker with defaults
    const notification = await prismocker.notifications.findUnique({
      where: { id: result.notificationId },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Test Title');
    expect(notification?.message).toBe('Test Message');
    expect(notification?.type).toBe('announcement'); // Default
    expect(notification?.priority).toBe('medium'); // Default
  });

  /**
   * Error case: Missing title
   *
   * Tests that missing title throws error.
   */
  it('should throw error for missing title', async () => {
    const executeResult = await t.execute({
      events: [
        {
          name: 'notification/create',
          data: {
            message: 'Test Message',
          },
        },
      ],
    });

    // Check error property (standard format)
    const error = (executeResult as { error?: Error | { message: string } })?.error;

    // Error should be captured
    expect(error).toBeDefined();

    // Handle both Error instances and error objects
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toBe('Invalid notification: title is required');

    // Verify no notification was created
    const allNotifications = await prismocker.notifications.findMany();
    expect(allNotifications.length).toBe(0);
  });

  /**
   * Error case: Missing message
   *
   * Tests that missing message throws error.
   */
  it('should throw error for missing message', async () => {
    const executeResult = await t.execute({
      events: [
        {
          name: 'notification/create',
          data: {
            title: 'Test Title',
          },
        },
      ],
    });

    // Check error property (standard format)
    const error = (executeResult as { error?: Error | { message: string } })?.error;

    // Error should be captured
    expect(error).toBeDefined();

    // Handle both Error instances and error objects
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toBe('Invalid notification: message is required');

    // Verify no notification was created
    const allNotifications = await prismocker.notifications.findMany();
    expect(allNotifications.length).toBe(0);
  });

  /**
   * Error case: Invalid action_href protocol
   *
   * Tests that non-http/https action_href throws error.
   */
  it('should throw error for invalid action_href protocol', async () => {
    const executeResult = await t.execute({
      events: [
        {
          name: 'notification/create',
          data: {
            title: 'Test Title',
            message: 'Test Message',
            action_href: 'javascript:alert("xss")',
          },
        },
      ],
    });

    // Check error property (standard format)
    const error = (executeResult as { error?: Error | { message: string } })?.error;

    // Error should be captured
    expect(error).toBeDefined();

    // Handle both Error instances and error objects
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toBe('Invalid action_href: only http and https URLs are allowed');

    // Verify no notification was created
    const allNotifications = await prismocker.notifications.findMany();
    expect(allNotifications.length).toBe(0);
  });

  /**
   * Error case: Invalid action_href format
   *
   * Tests that invalid URL format throws error.
   */
  it('should throw error for invalid action_href format', async () => {
    const executeResult = await t.execute({
      events: [
        {
          name: 'notification/create',
          data: {
            title: 'Test Title',
            message: 'Test Message',
            action_href: 'not-a-url',
          },
        },
      ],
    });

    // Check error property (standard format)
    const error = (executeResult as { error?: Error | { message: string } })?.error;

    // Error should be captured
    expect(error).toBeDefined();

    // Handle both Error instances and error objects
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toBe('Invalid action_href: must be a valid URL');

    // Verify no notification was created
    const allNotifications = await prismocker.notifications.findMany();
    expect(allNotifications.length).toBe(0);
  });

  /**
   * Success case: Generate UUID if id not provided
   *
   * Tests that UUID is generated when id is not provided.
   */
  it('should generate UUID when id is not provided', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'notification/create',
          data: {
            title: 'Test Title',
            message: 'Test Message',
          },
        },
      ],
    })) as { result: { success: boolean; notificationId: string } };

    expect(result.success).toBe(true);
    expect(result.notificationId).toBeDefined();
    // UUID format: 8-4-4-4-12 hex characters
    expect(result.notificationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify notification was created with generated UUID
    const notification = await prismocker.notifications.findUnique({
      where: { id: result.notificationId },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Test Title');
    expect(notification?.message).toBe('Test Message');
  });

  /**
   * Step test: create-notification step
   *
   * Tests the create-notification step individually.
   */
  it('should execute create-notification step correctly', async () => {
    const { result } = (await t.executeStep('create-notification', {
      events: [
        {
          name: 'notification/create',
          data: {
            title: 'Test Title',
            message: 'Test Message',
          },
        },
      ],
    })) as { result: { id: string } };

    expect(result.id).toBeDefined();

    // Verify notification was created in Prismocker
    const notification = await prismocker.notifications.findUnique({
      where: { id: result.id },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Test Title');
    expect(notification?.message).toBe('Test Message');
  });
});

describe('broadcastNotification', () => {
  let t: InngestTestEngine;
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: broadcastNotification,
    });

    // Initialize Prismocker and clear cache for a clean test state
    prismocker = prisma as unknown as PrismaClient;
    clearRequestCache();

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  /**
   * Cleanup after each test to prevent open handles
   */
  afterEach(async () => {
    // Clear all timers
    jest.clearAllTimers();

    // Ensure all pending promises are resolved
    await new Promise((resolve) => setImmediate(resolve));

    // Clear the test engine reference to allow garbage collection
    (t as any) = null;
  });

  /**
   * Success case: Broadcast notification successfully
   *
   * Tests that broadcast notification is created with high priority.
   */
  it('should broadcast notification successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'notification/broadcast',
          data: {
            title: 'Broadcast Title',
            message: 'Broadcast Message',
            type: 'announcement',
          },
        },
      ],
    })) as { result: { success: boolean; notificationId: string; broadcast: boolean } };

    expect(result.success).toBe(true);
    expect(result.notificationId).toBeDefined();
    expect(result.broadcast).toBe(true);

    // Verify notification was created in Prismocker with high priority (default for broadcast)
    const notification = await prismocker.notifications.findUnique({
      where: { id: result.notificationId },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Broadcast Title');
    expect(notification?.message).toBe('Broadcast Message');
    expect(notification?.type).toBe('announcement');
    expect(notification?.priority).toBe('high'); // Default for broadcast
  });

  /**
   * Error case: Missing title
   *
   * Tests that missing title throws error.
   */
  it('should throw error for missing title', async () => {
    const executeResult = await t.execute({
      events: [
        {
          name: 'notification/broadcast',
          data: {
            message: 'Broadcast Message',
          },
        },
      ],
    });

    // Check error property (standard format)
    const error = (executeResult as { error?: Error | { message: string } })?.error;

    // Error should be captured
    expect(error).toBeDefined();

    // Handle both Error instances and error objects
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toBe('Invalid notification: title is required');

    // Verify no notification was created
    const allNotifications = await prismocker.notifications.findMany();
    expect(allNotifications.length).toBe(0);
  });

  /**
   * Error case: Missing message
   *
   * Tests that missing message throws error.
   */
  it('should throw error for missing message', async () => {
    const executeResult = await t.execute({
      events: [
        {
          name: 'notification/broadcast',
          data: {
            title: 'Broadcast Title',
          },
        },
      ],
    });

    // Check error property (standard format)
    const error = (executeResult as { error?: Error | { message: string } })?.error;

    // Error should be captured
    expect(error).toBeDefined();

    // Handle both Error instances and error objects
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toBe('Invalid notification: message is required');

    // Verify no notification was created
    const allNotifications = await prismocker.notifications.findMany();
    expect(allNotifications.length).toBe(0);
  });
});
